import { workspace } from "vscode";
import { EXTENSION_ID, FOLD_CLOSING_BRACE_ID } from "./constants";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";

const foldedLinesCountProvider: BetterFoldingRangeProvider = {
  provideFoldingRanges: (document) => {
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

      const foldingClosingBrace = workspace.getConfiguration(EXTENSION_ID).get<string[]>(FOLD_CLOSING_BRACE_ID);
      const collapsedText = `⋯ ${endPosition.line - startPosition.line - 1} lines ⋯`;

      if (startPosition.line !== endPosition.line) {
        ranges.push({
          start: startPosition.line,
          end: foldingClosingBrace ? endPosition.line : endPosition.line - 1,
          startColumn: foldingClosingBrace ? braceIndex : undefined,
          collapsedText: foldingClosingBrace ? `{ ${collapsedText} }` : collapsedText,
        });
      }
    }

    return ranges;
  },
};
export default foldedLinesCountProvider;
