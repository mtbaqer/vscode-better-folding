import { Position, TextDocument } from "vscode";
import { BetterFoldingRange } from "../types";
import * as config from "../configuration";
import { bracketsToBracketsRanges } from "../utils/functions/utils";
import BracketsManager from "../bracket-pair-colorizer-2 src/bracketsManager";
import BracketsRange from "../utils/classes/bracketsRange";
import ExtendedMap from "../utils/classes/extendedMap";
import Token from "../bracket-pair-colorizer-2 src/token";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";

type PositionPair = [line: number, column: number];

export class BracketRangesProvider extends BetterFoldingRangeProvider {
  private bracketsManager: BracketsManager = new BracketsManager();

  private positionToBracketRange: ExtendedMap<PositionPair, BracketsRange | undefined>;
  private positionToFoldingRange: ExtendedMap<PositionPair, BetterFoldingRange | undefined>;
  private positionToToken: ExtendedMap<PositionPair, Token | undefined>;

  constructor() {
    super();

    this.positionToBracketRange = new ExtendedMap(() => undefined);
    this.positionToFoldingRange = new ExtendedMap(() => undefined);
    this.positionToToken = new ExtendedMap(() => undefined);

    this.updateAllDocuments();
  }

  public updateAllDocuments() {
    this.bracketsManager.updateAllDocuments();
  }

  protected async calculateFoldingRanges(document: TextDocument) {
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
    this.positionToBracketRange.clear();
    this.positionToFoldingRange.clear();
    this.positionToToken.clear();

    this.populatePositionToBracketRangeMap(bracketsRanges);
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

  private populatePositionToBracketRangeMap(bracketsRanges: BracketsRange[]) {
    for (const bracketsRange of bracketsRanges) {
      const line = bracketsRange.start.line;
      const column = bracketsRange.start.character;
      this.positionToBracketRange.set([line, column], bracketsRange);
    }
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
      [end, collapsedText] = this.appendPostFoldingRangeText(bracketsRange, collapsedText, document);
    }

    return { start, end, startColumn, collapsedText };
  }

  private getStartColumn(bracketsRange: BracketsRange): number | undefined {
    const showFoldedBrackets = config.showFoldedBrackets();

    if (!showFoldedBrackets) return undefined;

    return bracketsRange.start.character; //Position.character is confusingly the column.
  }

  private getCollapsedText(bracketsRange: BracketsRange, document: TextDocument, shallow = false): string {
    let collapsedText = "…";

    const showFoldedBodyLinesCount = config.showFoldedBodyLinesCount();
    if (showFoldedBodyLinesCount) {
      collapsedText = this.getFoldedLinesCountCollapsedText(bracketsRange);
    }

    const showFunctionParameters = config.showFunctionParameters();
    if (showFunctionParameters && bracketsRange.startBracket.token.content === "(") {
      collapsedText = this.getFunctionParamsCollapsedText(bracketsRange, document);
    }

    const showObjectPreviews = config.showObjectPreviews();
    if (showObjectPreviews && this.isObjectLiteral(bracketsRange) && !shallow) {
      collapsedText = this.getObjectLiteralCollapsedText(bracketsRange, document);
    }

    const showFoldedBrackets = config.showFoldedBrackets();
    if (showFoldedBrackets) {
      collapsedText = this.surroundWithBrackets(bracketsRange, collapsedText);
    }

    return collapsedText;
  }

  private getFunctionParamsCollapsedText(bracketsRange: BracketsRange, document: TextDocument): string {
    const paramTokens: string[] = [];
    let line = bracketsRange.start.line;
    let column = bracketsRange.start.character + 1;

    while (new Position(line, column).isBefore(bracketsRange.end)) {
      const bracketRange = this.positionToBracketRange.get([line, column]);
      if (bracketRange?.startBracket.token.content === "(") {
        column = bracketRange.end.character;
        line = bracketRange.end.line;
      }

      const token = this.positionToToken.get([line, column]);
      if (token) {
        paramTokens.push(token.content);
        column = token.range.end.character;
      }
      if (column >= document.lineAt(line).text.length) {
        line++;
        column = -1;
      }
      column++;
    }

    return paramTokens.length ? paramTokens.join(", ") : "…";
  }

  private isObjectLiteral(bracketsRange: BracketsRange): boolean {
    if (bracketsRange.startBracket.token.content === "{") {
      const { scopes } = bracketsRange.startBracket.token;
      if (scopes.some((scope) => scope.startsWith("punctuation.definition.dict.begin"))) return true;
      if (scopes.some((scope) => scope.startsWith("meta.objectliteral"))) return true;
    }

    return false;
  }

  private getObjectLiteralCollapsedText(bracketsRange: BracketsRange, document: TextDocument): string {
    let collapsedText = "";

    let foundText = false;

    let line = bracketsRange.start.line;
    let column = bracketsRange.start.character + 1;
    let lineText = document.lineAt(line).text;

    while (new Position(line, column).isBefore(bracketsRange.end)) {
      const [end, rangeCollapsedText] = this.getShallowCollapsedText([line, column], document);
      if (rangeCollapsedText) {
        collapsedText += rangeCollapsedText;
        line = end + 1;
        break;
      }
      if (column >= lineText.length) {
        line++;
        column = -1;
        lineText = document.lineAt(line).text;
        if (foundText) break;
      }
      if (lineText[column]) {
        foundText = true;
        collapsedText += lineText[column];
      }
      column++;
    }

    if (line < bracketsRange.end.line) {
      collapsedText += "…";
    }

    return " " + collapsedText + " ";
  }

  private getShallowCollapsedText(
    [line, column]: PositionPair,
    document: TextDocument
  ): [end: number, collapsedText: string] {
    const bracketsRange = this.positionToBracketRange.get([line, column]);
    const emptyBracketsRange = bracketsRange?.startBracket.token.range.end.isEqual(
      bracketsRange.endBracket.token.range.start
    );
    if (bracketsRange && !emptyBracketsRange) {
      const currentRangeCollapsedText = this.getCollapsedText(bracketsRange, document, true);
      return this.appendPostFoldingRangeText(bracketsRange, currentRangeCollapsedText, document);
    }
    return [line, ""];
  }

  private surroundWithBrackets(bracketsRange: BracketsRange, collapsedText: string): string {
    return `${bracketsRange.startBracket.token.content}${collapsedText}${bracketsRange.endBracket.token.content}`;
  }

  private getFoldedLinesCountCollapsedText(bracketsRange: BracketsRange): string {
    let linesCount = bracketsRange.end.line - bracketsRange.start.line - 1;
    linesCount = Math.max(linesCount, 0); //For empty ranges, the start and end lines are the same.
    const line = linesCount === 1 ? "line" : "lines";
    return ` ⋯ ${linesCount} ${line} ⋯ `;
  }

  private appendPostFoldingRangeText(
    bracketsRange: BracketsRange,
    initialCollapsedText: string,
    document: TextDocument
  ): [end: number, collapsedText: string] {
    const chainFoldingRanges = config.chainFoldingRanges();

    let end = bracketsRange.end.line;
    let collapsedText = initialCollapsedText;

    const line = bracketsRange.end.line;
    const lineContent = document.lineAt(line).text;

    for (let column = bracketsRange.end.character; column < lineContent.length; column++) {
      const foldingRange = this.positionToFoldingRange.get([line, column]);
      if (chainFoldingRanges && foldingRange) {
        end = foldingRange.end;
        collapsedText += foldingRange.collapsedText;
        break;
      }

      collapsedText += lineContent[column];
    }

    return [end, collapsedText];
  }

  public restart() {
    super.restart();
    this.bracketsManager = new BracketsManager();
    this.positionToFoldingRange.clear();
  }
}
