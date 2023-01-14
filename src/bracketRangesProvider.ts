import { Position, TextDocument, workspace } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import * as config from "./configuration";

export class BracketRangesProvider implements BetterFoldingRangeProvider {
  public provideFoldingRanges(document: TextDocument): BetterFoldingRange[] {
    const ranges: BetterFoldingRange[] = [];

    //regex to match functions in typescript
    const functionRegex =
      /function\s*([A-z0-9]+)?\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)\s*\{(?:[^}{]+|\{(?:[^}{]+|\{[^}{]*\})*\})*\}/g;

    let match;
    while ((match = functionRegex.exec(document.getText()))) {
      if (match && !match[0]) continue;

      const startPosition = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);
      const braceIndex = match[0].indexOf("{");

      const foldClosingBrackets = config.foldClosingBrackets();

      const collapsedText = this.getCollapsedText(match, startPosition, endPosition);

      if (startPosition.line !== endPosition.line) {
        ranges.push({
          start: startPosition.line,
          end: foldClosingBrackets ? endPosition.line : endPosition.line - 1,
          startColumn: foldClosingBrackets ? braceIndex : undefined,
          collapsedText,
        });
      }
    }

    return ranges;
  }

  private getCollapsedText(match: RegExpExecArray, startPosition: Position, endPosition: Position) {
    const foldClosingBrackets = config.foldClosingBrackets();

    const collapsedTextStrategy = config.collapsedTextStrategy();

    let collapsedText = "…";
    if (collapsedTextStrategy === "number of lines folded") {
      collapsedText = ` ⋯ ${endPosition.line - startPosition.line - 1} lines ⋯ `;
    }

    return foldClosingBrackets ? `{${collapsedText}}` : collapsedText;
  }
}
