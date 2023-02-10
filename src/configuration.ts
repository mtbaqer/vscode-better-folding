import { workspace } from "vscode";
import { CONFIG_ID } from "./constants";

export function foldClosingBrackets() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("foldClosingBrackets") ?? false;
}

export function foldClosingTags() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("foldClosingTags") ?? false;
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

export function chainFoldingRanges() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("chainFoldingRanges") && showFoldedBrackets();
}

export function showObjectPreviews() {
  return workspace.getConfiguration(CONFIG_ID).get<boolean>("showObjectPreviews") && showFoldedBrackets();
}
