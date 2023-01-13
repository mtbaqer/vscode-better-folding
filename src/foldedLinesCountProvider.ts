import { FoldingRangeKind } from "vscode";
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

      if (startPosition.line !== endPosition.line) {
        ranges.push({
          start: startPosition.line,
          end: endPosition.line,
          startColumn: braceIndex,
          kind: FoldingRangeKind.Region,
          collapsedText: `{ ⋯ ${endPosition.line - startPosition.line - 1} lines ⋯ }`,
        });
      }
    }

    return ranges;
  },
};
export default foldedLinesCountProvider;
