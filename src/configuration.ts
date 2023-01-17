import { workspace } from "vscode";

const EXTENSION_ID = "better-folding";

export function foldClosingBrackets() {
  return workspace.getConfiguration(EXTENSION_ID).get<boolean>("foldClosingBrackets") ?? false;
}

type CollapsedTextStrategy = "ellipsis" | "count body lines";
export function collapsedTextStrategy() {
  return workspace.getConfiguration(EXTENSION_ID).get<CollapsedTextStrategy>("collapsedTextStrategy") ?? "ellipsis";
}
