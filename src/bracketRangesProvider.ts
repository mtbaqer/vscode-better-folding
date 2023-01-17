import { TextDocument } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import * as config from "./configuration";
import { bracketsToBracketsRanges } from "./utils/utils";
import BracketsManager from "./BracketManager/bracketsManager";
import BracketsRange from "./utils/classes/bracketsRange";

export class BracketRangesProvider implements BetterFoldingRangeProvider {
  public async provideFoldingRanges(document: TextDocument): Promise<BetterFoldingRange[]> {
    const bracketsManager = new BracketsManager();
    const allBrackets = await bracketsManager.updateDocument(document);
    if (!allBrackets) return [];

    const bracketsRanges = bracketsToBracketsRanges(allBrackets);
    const foldingRanges = this.bracketsRangesToFoldingRanges(bracketsRanges);

    return foldingRanges;
  }

  private bracketsRangesToFoldingRanges(bracketsRanges: BracketsRange[]): BetterFoldingRange[] {
    const foldingRanges: BetterFoldingRange[] = [];
    for (const bracketsRange of bracketsRanges) {
      if (bracketsRange.start.line === bracketsRange.end.line) continue;
      const foldingRange = this.toFoldingRange(bracketsRange);
      foldingRanges.push(foldingRange);
    }
    return foldingRanges;
  }

  private toFoldingRange(bracketsRange: BracketsRange): BetterFoldingRange {
    const foldClosingBrackets = config.foldClosingBrackets();

    return {
      start: bracketsRange.start.line,
      end: bracketsRange.end.line - (foldClosingBrackets ? 0 : 1),
      startColumn: this.getStartColumn(bracketsRange),
      collapsedText: this.getCollapsedText(bracketsRange),
    };
  }

  private getStartColumn(bracketsRange: BracketsRange): number | undefined {
    const foldClosingBrackets = config.foldClosingBrackets();

    //TODO: make foldClosingBracket related to only folding the last line.
    //and add a new "brackets" option for collapsedTextStrategy.
    if (!foldClosingBrackets) return undefined;

    return bracketsRange.start.character;
  }

  private getCollapsedText(bracketsRange: BracketsRange): string {
    let collapsedText = "…";

    const collapsedTextStrategy = config.collapsedTextStrategy();
    if (collapsedTextStrategy === "number of lines folded") {
      collapsedText = this.getFoldedLinesCountCollapsedText(bracketsRange);
    }

    collapsedText = this.surroundWithBrackets(bracketsRange, collapsedText);

    return collapsedText;
  }

  private surroundWithBrackets(bracketsRange: BracketsRange, collapsedText: string): string {
    return `${bracketsRange.startBracket.token.character}${collapsedText}${bracketsRange.endBracket.token.character}`;
  }

  private getFoldedLinesCountCollapsedText(bracketsRange: BracketsRange): string {
    const linesCount = bracketsRange.end.line - bracketsRange.start.line;
    //TODO: check if closing bracket is by itself on the last line and -1 if so.
    return ` ⋯ ${linesCount} lines ⋯ `;
  }
}
