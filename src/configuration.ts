import { workspace } from "vscode";

const EXTENSION_ID = "better-folding";

export function foldClosingBrackets() {
  return workspace.getConfiguration(EXTENSION_ID).get<boolean>("foldClosingBrackets") ?? false;
}

type CollapsedTextStrategy = "ellipsis" | "number of lines folded";
export function collapsedTextStrategy() {
  return workspace.getConfiguration(EXTENSION_ID).get<CollapsedTextStrategy>("collapsedTextContent") ?? "ellipsis";
}
