import { CancellationToken, FoldingContext, Position, TextDocument, Uri } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import * as config from "./configuration";
import { bracketsToBracketsRanges } from "./utils/utils";
import BracketsManager from "./bracket-pair-colorizer-2 src/bracketsManager";
import BracketsRange from "./utils/classes/bracketsRange";
import ExtendedMap from "./utils/classes/extendedMap";
import Token from "./bracket-pair-colorizer-2 src/token";

type PositionPair = [line: number, column: number];

export class BracketRangesProvider implements BetterFoldingRangeProvider {
  private bracketsManager: BracketsManager = new BracketsManager();

  //Promisized to allow useCachedRanges to await for the foldingRanges currently being calculated.
  private documentToFoldingRanges: ExtendedMap<Uri, Promise<BetterFoldingRange[]>>;

  private positionToFoldingRange: ExtendedMap<PositionPair, BetterFoldingRange | undefined>;
  private positionToToken: ExtendedMap<PositionPair, Token | undefined>;

  constructor() {
    this.documentToFoldingRanges = new ExtendedMap(async () => []);

    this.positionToFoldingRange = new ExtendedMap(() => undefined);
    this.positionToToken = new ExtendedMap(() => undefined);

    this.updateAllDocuments();
  }

  public updateAllDocuments() {
    this.bracketsManager.updateAllDocuments();
  }

  public async provideFoldingRanges(
    document: TextDocument,
    context?: FoldingContext,
    token?: CancellationToken,
    useCachedRanges = false
  ): Promise<BetterFoldingRange[]> {
    if (useCachedRanges) {
      return this.documentToFoldingRanges.get(document.uri);
    }

    this.documentToFoldingRanges.set(document.uri, this.updateFoldingRanges(document));
    return this.documentToFoldingRanges.get(document.uri)!;
  }

  private async updateFoldingRanges(document: TextDocument) {
    const tokenizedDocument = await this.bracketsManager.updateDocument(document);
    if (!tokenizedDocument) return [];

    const bracketsRanges = bracketsToBracketsRanges(tokenizedDocument.brackets);
    const foldingRanges = this.bracketsRangesToFoldingRanges(bracketsRanges, tokenizedDocument.tokens, document);

    return foldingRanges;
  }

  private bracketsRangesToFoldingRanges(
    bracketsRanges: BracketsRange[],
    tokens: Token[],
    document: TextDocument
  ): BetterFoldingRange[] {
    this.positionToFoldingRange.clear();
    this.positionToToken.clear();

    this.populatePositionToTokenMap(tokens);

    const foldingRanges: BetterFoldingRange[] = [];
    for (const bracketsRange of bracketsRanges) {
      if (bracketsRange.start.line === bracketsRange.end.line) continue;

      const foldingRange = this.toFoldingRange(bracketsRange, document);
      foldingRanges.push(foldingRange);
      this.addToPositionToFoldingRangeMap(foldingRange, document);
    }
    return foldingRanges;
  }

  private populatePositionToTokenMap(tokens: Token[]) {
    for (const token of tokens) {
      const line = token.range.start.line;
      const column = token.range.start.character;
      this.positionToToken.set([line, column], token);
    }
  }

  private addToPositionToFoldingRangeMap(foldingRange: BetterFoldingRange, document: TextDocument) {
    const line = foldingRange.start;
    const column = foldingRange.startColumn ?? document.lineAt(line).text.length;
    this.positionToFoldingRange.set([line, column], foldingRange);
  }

  private toFoldingRange(bracketsRange: BracketsRange, document: TextDocument): BetterFoldingRange {
    const foldClosingBrackets = config.foldClosingBrackets();
    const showFoldedBrackets = config.showFoldedBrackets();

    let start = bracketsRange.start.line;
    let end = bracketsRange.end.line - (foldClosingBrackets ? 0 : 1);
    let startColumn = this.getStartColumn(bracketsRange);
    let collapsedText = this.getCollapsedText(bracketsRange, document);

    if (showFoldedBrackets) {
      [start, end, collapsedText] = this.chainFoldingRanges(bracketsRange, collapsedText, document);
    }

    return { start, end, startColumn, collapsedText };
  }

  private getStartColumn(bracketsRange: BracketsRange): number | undefined {
    const showFoldedBrackets = config.showFoldedBrackets();

    if (!showFoldedBrackets) return undefined;

    return bracketsRange.start.character; //Position.character is confusingly the column.
  }

  private getCollapsedText(bracketsRange: BracketsRange, document: TextDocument): string {
    let collapsedText = "…";

    const showFoldedBodyLinesCount = config.showFoldedBodyLinesCount();
    if (showFoldedBodyLinesCount) {
      collapsedText = this.getFoldedLinesCountCollapsedText(bracketsRange);
    }

    const showFoldedBrackets = config.showFoldedBrackets();
    if (showFoldedBrackets) {
      if (bracketsRange.startBracket.token.content === "(") {
        collapsedText = this.getFunctionParamsCollapsedText(bracketsRange, document);
      }
      collapsedText = this.surroundWithBrackets(bracketsRange, collapsedText);
    }

    return collapsedText;
  }

  private getFunctionParamsCollapsedText(bracketsRange: BracketsRange, document: TextDocument): string {
    let collapsedText = "";
    let line = bracketsRange.start.line;
    let column = bracketsRange.start.character + 1;

    while (new Position(line, column).isBefore(bracketsRange.end)) {
      const token = this.positionToToken.get([line, column]);
      if (token) {
        collapsedText += token.content;
        collapsedText += ", ";
        column = token.range.end.character;
      }
      if (column >= document.lineAt(line).text.length) {
        line++;
        column = -1;
      }
      column++;
    }

    //remove last ", "
    return collapsedText.slice(0, -2);
  }

  private surroundWithBrackets(bracketsRange: BracketsRange, collapsedText: string): string {
    return `${bracketsRange.startBracket.token.content}${collapsedText}${bracketsRange.endBracket.token.content}`;
  }

  private getFoldedLinesCountCollapsedText(bracketsRange: BracketsRange): string {
    const linesCount = bracketsRange.end.line - bracketsRange.start.line - 1;
    return ` ⋯ ${linesCount} lines ⋯ `;
  }

  private chainFoldingRanges(
    bracketsRange: BracketsRange,
    initialCollapsedText: string,
    document: TextDocument
  ): [start: number, end: number, collapsedText: string] {
    let end = bracketsRange.end.line;
    let collapsedText = initialCollapsedText;

    const line = bracketsRange.end.line;
    const lineContent = document.lineAt(line).text;

    for (let column = bracketsRange.end.character; column < lineContent.length; column++) {
      const foldingRange = this.positionToFoldingRange.get([line, column]);
      if (!foldingRange) {
        collapsedText += lineContent[column];
        continue;
      }

      end = foldingRange.end;
      collapsedText += foldingRange.collapsedText;
    }

    return [bracketsRange.start.line, end, collapsedText];
  }

  public restart() {
    this.bracketsManager = new BracketsManager();
    this.documentToFoldingRanges.clear();
    this.positionToFoldingRange.clear();
  }
}
