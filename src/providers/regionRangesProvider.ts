import { TextDocument, FoldingRangeKind } from "vscode";
import { BetterFoldingRange } from "../types";
import * as config from "../configuration";
import BetterFoldingRangeProvider from "./betterFoldingRangeProvider";

const REGION_REGEX = /#region (.*)\n(?:.|\n)*?#endregion/g;

export default class RegionRangesProvider extends BetterFoldingRangeProvider {
  protected async calculateFoldingRanges(document: TextDocument) {
    if (!config.showOnlyRegionsDescriptions()) return [];

    const ranges: BetterFoldingRange[] = [];

    let match;
    while ((match = REGION_REGEX.exec(document.getText()))) {
      if (!match?.[0] || !match?.[1]) continue;

      const startPosition = document.positionAt(match.index);
      const endPosition = document.positionAt(match.index + match[0].length);

      if (startPosition.line !== endPosition.line) {
        ranges.push({
          start: startPosition.line,
          end: endPosition.line,
          kind: FoldingRangeKind.Region,
          collapsedText: match[1],
          startColumn: document.lineAt(startPosition.line).firstNonWhitespaceCharacterIndex,
        });
      }
    }

    return ranges;
  }
}
