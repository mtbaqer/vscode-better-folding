import { ExtensionContext, FoldingRange, FoldingRangeKind, languages, window } from "vscode";
import closingBraceProvider from "./closingBraceProvider";

export function activate(context: ExtensionContext) {
  // Courtesy of vscode-explicit-fold,
  // apparently if you delay the folding provider by a second,
  // it can override the default language folding provider.
  setTimeout(() => {
    context.subscriptions.push(
      languages.registerFoldingRangeProvider({ language: "typescript", scheme: "file" }, closingBraceProvider)
    );
  }, 1000);

  context.subscriptions.push(
    window.onDidChangeTextEditorVisibleRanges((e) => {
      if (e) {
        console.log("onDidChangeTextEditorVisibleRanges");
      }
    })
  );
}

export function deactivate() {}
