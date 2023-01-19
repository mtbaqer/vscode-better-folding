import { workspace } from "vscode";

const CONFIG_ID = "betterFolding";

export function foldClosingBrackets() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("foldClosingBrackets") ?? false;
}

export function showFoldedBodyLinesCount() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showFoldedBodyLinesCount") && foldClosingBrackets();
}

export function showFoldedBrackets() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showFoldedBrackets") ?? false;
}
