import { CancellationToken, FoldingContext, FoldingRange, FoldingRangeKind, TextDocument } from "vscode";
import Bracket from "./bracket-pair-colorizer-2 src/bracket";
import Token from "./bracket-pair-colorizer-2 src/token";

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
    token?: CancellationToken,
    useCachedRanges?: boolean
  ): Promise<BetterFoldingRange[]>;
}

export interface TokenizedDocument {
  brackets: Bracket[];
  tokens: Token[];
}
