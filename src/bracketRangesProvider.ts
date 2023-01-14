import { Position, TextDocument, workspace } from "vscode";
import { COLLAPSED_TEXT_CONTENT, EXTENSION_ID, FOLD_CLOSING_BRACE } from "./constants";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";

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

      const foldClosingBrace = workspace.getConfiguration(EXTENSION_ID).get<string>(FOLD_CLOSING_BRACE);

      const collapsedText = this.getCollapsedText(match, startPosition, endPosition);

      if (startPosition.line !== endPosition.line) {
        ranges.push({
          start: startPosition.line,
          end: foldClosingBrace ? endPosition.line : endPosition.line - 1,
          startColumn: foldClosingBrace ? braceIndex : undefined,
          collapsedText,
        });
      }
    }

    return ranges;
  }

  private getCollapsedText(match: RegExpExecArray, startPosition: Position, endPosition: Position) {
    const foldClosingBrace = workspace.getConfiguration(EXTENSION_ID).get<string>(FOLD_CLOSING_BRACE);
    const collapsedTextConfiguration = workspace.getConfiguration(EXTENSION_ID).get<string>(COLLAPSED_TEXT_CONTENT);

    let collapsedText = "…";
    if (collapsedTextConfiguration === "number of lines folded") {
      collapsedText = ` ⋯ ${endPosition.line - startPosition.line - 1} lines ⋯ `;
    }

    return foldClosingBrace ? `{${collapsedText}}` : collapsedText;
  }
}
