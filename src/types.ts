import { CancellationToken, FoldingContext, FoldingRange, FoldingRangeKind, TextDocument } from "vscode";

export interface BetterFoldingRange extends FoldingRange {
  start: number;
  end: number;
  startColumn?: number;
  kind?: FoldingRangeKind;
  collapsedText?: string;
}

export interface BetterFoldingRangeProvider {
  provideFoldingRanges(
    document: TextDocument,
    context?: FoldingContext,
    token?: CancellationToken
  ): BetterFoldingRange[];
}
