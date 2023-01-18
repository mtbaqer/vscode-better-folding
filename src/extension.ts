import { ExtensionContext, languages, window, workspace } from "vscode";
import { BracketRangesProvider } from "./bracketRangesProvider";
import FoldingDecorator from "./foldingDecorator";

export function activate(context: ExtensionContext) {
  const foldingDecorator = new FoldingDecorator();
  context.subscriptions.push(foldingDecorator);
  const bracketRangesProvider = new BracketRangesProvider();

  // Courtesy of vscode-explicit-fold,
  // apparently if you delay the folding provider by a second, it can override the default language folding provider.
  setTimeout(() => {
    context.subscriptions.push(languages.registerFoldingRangeProvider("typescript", bracketRangesProvider));
    foldingDecorator.registerFoldingRangeProvider("typescript", bracketRangesProvider);
  }, 1000);

  context.subscriptions.push(
    window.onDidChangeVisibleTextEditors(() => {
      bracketRangesProvider.updateAllDocuments();
    }),
    workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length > 0) bracketRangesProvider.provideFoldingRanges(e.document);
    }),
    window.onDidChangeTextEditorVisibleRanges((e) => {
      foldingDecorator.triggerUpdateDecorations(e.textEditor);
    })
  );

  foldingDecorator.triggerUpdateDecorations();
}

export function deactivate() {}
