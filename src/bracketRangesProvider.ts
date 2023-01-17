import { TextDocument } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import * as config from "./configuration";
import { bracketsToBracketsRanges } from "./utils/utils";
import BracketsManager from "./BracketManager/bracketsManager";
import BracketsRange from "./utils/classes/bracketsRange";
import ExtendedMap from "./utils/classes/extendedMap";

export class BracketRangesProvider implements BetterFoldingRangeProvider {
  private document: TextDocument = null!; //TODO: Make this type safe
  private positionToFoldingRange: ExtendedMap<[line: number, column: number], BetterFoldingRange> = new ExtendedMap();

  public async provideFoldingRanges(document: TextDocument): Promise<BetterFoldingRange[]> {
    this.document = document;

    const bracketsManager = new BracketsManager();
    const allBrackets = await bracketsManager.updateDocument(document);
    if (!allBrackets) return [];

    const bracketsRanges = bracketsToBracketsRanges(allBrackets);
    const foldingRanges = this.bracketsRangesToFoldingRanges(bracketsRanges);

    return foldingRanges;
  }

  private bracketsRangesToFoldingRanges(bracketsRanges: BracketsRange[]): BetterFoldingRange[] {
    this.positionToFoldingRange.clear();

    const foldingRanges: BetterFoldingRange[] = [];
    for (const bracketsRange of bracketsRanges) {
      if (bracketsRange.start.line === bracketsRange.end.line) continue;
      const foldingRange = this.toFoldingRange(bracketsRange);
      foldingRanges.push(foldingRange);

      const line = foldingRange.start;
      const column = foldingRange.startColumn ?? this.document.lineAt(line).text.length;
      this.positionToFoldingRange.set([line, column], foldingRange);
    }
    return foldingRanges;
  }

  private toFoldingRange(bracketsRange: BracketsRange): BetterFoldingRange {
    const foldClosingBrackets = config.foldClosingBrackets();

    let start = bracketsRange.start.line;
    let end = bracketsRange.end.line - (foldClosingBrackets ? 0 : 1);
    let startColumn = this.getStartColumn(bracketsRange);
    let collapsedText = this.getCollapsedText(bracketsRange);

    if (foldClosingBrackets) {
      [start, end, collapsedText] = this.chainFoldingRanges(bracketsRange, collapsedText);
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
    initialCollapsedText: string
  ): [start: number, end: number, collapsedText: string] {
    let end = bracketsRange.end.line;
    let collapsedText = initialCollapsedText;

    const line = bracketsRange.end.line;
    const lineContent = this.document.lineAt(line).text;

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
