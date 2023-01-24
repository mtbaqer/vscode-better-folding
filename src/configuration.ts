import { workspace } from "vscode";

export const CONFIG_ID = "betterFolding";

export function foldClosingBrackets() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("foldClosingBrackets") ?? false;
}

export function showFoldedBodyLinesCount() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showFoldedBodyLinesCount") ?? false;
}

export function showFoldedBrackets() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showFoldedBrackets") && foldClosingBrackets();
}

export function excludedLanguages() {
  return workspace.getConfiguration(CONFIG_ID).get<string[]>("excludedLanguages") ?? [];
}

export function showOnlyRegionsDescriptions() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showOnlyRegionsDescriptions") ?? false;
}

export function showFunctionParameters() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showFunctionParameters") && showFoldedBrackets();
}
