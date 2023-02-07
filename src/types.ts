import { FoldingRange, FoldingRangeKind, TextEditorDecorationType } from "vscode";
import Bracket from "./bracket-pair-colorizer-2 src/bracket";
import Token from "./bracket-pair-colorizer-2 src/token";
import BetterFoldingRangeProvider from "./providers/betterFoldingRangeProvider";

export interface BetterFoldingRange extends FoldingRange {
  start: number;
  end: number;
  startColumn?: number;
  kind?: FoldingRangeKind;
  collapsedText?: string;
}

export interface TokenizedDocument {
  brackets: Bracket[];
  tokens: Token[];
}

export type ProvidersList = [selector: string, provider: BetterFoldingRangeProvider][];

export type DecorationsRecord = Record<string, TextEditorDecorationType>;
