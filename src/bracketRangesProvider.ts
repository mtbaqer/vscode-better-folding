import { CancellationToken, FoldingContext, TextDocument, Uri } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import * as config from "./configuration";
import { bracketsToBracketsRanges } from "./utils/utils";
import BracketsManager from "./BracketManager/bracketsManager";
import BracketsRange from "./utils/classes/bracketsRange";
import ExtendedMap from "./utils/classes/extendedMap";

type PositionPair = [line: number, column: number];

export class BracketRangesProvider implements BetterFoldingRangeProvider {
  private readonly bracketsManager: BracketsManager = new BracketsManager();
  //Promisized to allow useCachedRanges to await for the foldingRanges currently being calculated.
  private readonly documentToFoldingRanges: ExtendedMap<Uri, Promise<BetterFoldingRange[]>>;
  private readonly positionToFoldingRange: ExtendedMap<PositionPair, BetterFoldingRange | undefined>;

  constructor() {
    this.documentToFoldingRanges = new ExtendedMap(async () => []);
    this.positionToFoldingRange = new ExtendedMap(() => undefined);

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
    const allBrackets = await this.bracketsManager.updateDocument(document);
    if (!allBrackets) return [];

    const bracketsRanges = bracketsToBracketsRanges(allBrackets);
    const foldingRanges = this.bracketsRangesToFoldingRanges(bracketsRanges, document);

    return foldingRanges;
  }

  private bracketsRangesToFoldingRanges(bracketsRanges: BracketsRange[], document: TextDocument): BetterFoldingRange[] {
    this.positionToFoldingRange.clear();

    const foldingRanges: BetterFoldingRange[] = [];
    for (const bracketsRange of bracketsRanges) {
      if (bracketsRange.start.line === bracketsRange.end.line) continue;
      const foldingRange = this.toFoldingRange(bracketsRange, document);
      foldingRanges.push(foldingRange);

      const line = foldingRange.start;
      const column = foldingRange.startColumn ?? document.lineAt(line).text.length;
      this.positionToFoldingRange.set([line, column], foldingRange);
    }
    return foldingRanges;
  }

  private toFoldingRange(bracketsRange: BracketsRange, document: TextDocument): BetterFoldingRange {
    const foldClosingBrackets = config.foldClosingBrackets();

    let start = bracketsRange.start.line;
    let end = bracketsRange.end.line - (foldClosingBrackets ? 0 : 1);
    let startColumn = this.getStartColumn(bracketsRange);
    let collapsedText = this.getCollapsedText(bracketsRange);

    if (foldClosingBrackets) {
      [start, end, collapsedText] = this.chainFoldingRanges(bracketsRange, collapsedText, document);
    }

    return { start, end, startColumn, collapsedText };
  }

  private getStartColumn(bracketsRange: BracketsRange): number | undefined {
    const foldClosingBrackets = config.foldClosingBrackets();

    //TODO: make foldClosingBracket related to only folding the last line.
    //and add a new "brackets" option for collapsedTextStrategy.
    if (!foldClosingBrackets) return undefined;

    return bracketsRange.start.character; //Position.character is confusingly the column.
  }

  private getCollapsedText(bracketsRange: BracketsRange): string {
    let collapsedText = "…";

    const collapsedTextStrategy = config.collapsedTextStrategy();
    if (collapsedTextStrategy === "count body lines") {
      collapsedText = this.getFoldedLinesCountCollapsedText(bracketsRange);
    }

    collapsedText = this.surroundWithBrackets(bracketsRange, collapsedText);

    return collapsedText;
  }

  private surroundWithBrackets(bracketsRange: BracketsRange, collapsedText: string): string {
    return `${bracketsRange.startBracket.token.character}${collapsedText}${bracketsRange.endBracket.token.character}`;
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
}
