import { TextDocument, Range, Position } from "vscode";
import { BetterFoldingRange } from "../types";
import { ProgramStatement } from "@typescript-eslint/types/dist/generated/ast-spec";
import Bracket from "../BracketManager/bracket";
import BracketClose from "../BracketManager/bracketClose";
import BracketsRange from "./classes/bracketsRange";

export function groupArrayToMap<T, V>(array: T[], getValue: (element: T) => V, defaultValue?: V): Map<V, T[]> {
  const map: Map<V, T[]> = new Map();

  for (const element of array) {
    const value = getValue(element) ?? defaultValue;
    if (!value) continue;

    const valueCollection = map.get(value);
    if (!valueCollection) {
      map.set(value, [element]);
    } else {
      valueCollection.push(element);
    }
  }

  return map;
}

export function foldingRangeToRange(document: TextDocument): (foldingRange: BetterFoldingRange) => Range {
  return (foldingRange) =>
    new Range(
      foldingRange.start,
      foldingRange.startColumn ?? document.lineAt(foldingRange.start).text.length,
      foldingRange.end,
      document.lineAt(foldingRange.end).text.length
    );
}

export function isStatement(node: any): node is ProgramStatement {
  return Boolean(node) && node.hasOwnProperty("loc");
}

export function bracketsToBracketsRanges(brackets: Bracket[], sortBy: "end" | "start" = "end"): BracketsRange[] {
  const ranges: BracketsRange[] = [];
  for (let i = brackets.length - 1; i >= 0; i--) {
    const bracket = brackets[i];
    if (bracket instanceof BracketClose) {
      const openBracket = bracket.openBracket;
      if (openBracket) {
        const bracketsRange = new BracketsRange(openBracket, bracket);
        ranges.push(bracketsRange);
      }
    }
  }
  return sortBy === "end" ? ranges : ranges.reverse();
}
