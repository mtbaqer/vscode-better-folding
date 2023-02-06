import { TextDocument, FoldingContext, CancellationToken, FoldingRangeKind, Uri } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import * as config from "./configuration";
import ExtendedMap from "./utils/classes/extendedMap";

const REGION_REGEX = /#region (.*)\n(?:.|\n)*?#endregion/g;

export default class RegionRangesProvider implements BetterFoldingRangeProvider {
  //Promisized to allow useCachedRanges to await for the foldingRanges currently being calculated.
  private documentToFoldingRanges: ExtendedMap<Uri, Promise<BetterFoldingRange[]>>;

  constructor() {
    this.documentToFoldingRanges = new ExtendedMap(async () => []);
  }

  public updateRanges(document: TextDocument) {
    this.documentToFoldingRanges.set(document.uri, this.calculateFoldingRanges(document));
  }

  public async provideFoldingRanges(document: TextDocument): Promise<BetterFoldingRange[]> {
    return this.documentToFoldingRanges.get(document.uri);
  }

  private async calculateFoldingRanges(document: TextDocument) {
    //TODO: Optimize this by caching ranges.
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

  public restart() {}
}
