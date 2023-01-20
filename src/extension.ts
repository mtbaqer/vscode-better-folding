import { ExtensionContext, languages, window, workspace } from "vscode";
import { BracketRangesProvider } from "./bracketRangesProvider";
import { CONFIG_ID } from "./configuration";
import FoldingDecorator from "./foldingDecorator";

let foldingDecorator = new FoldingDecorator();
export function activate(context: ExtensionContext) {
  context.subscriptions.push(foldingDecorator);
  const bracketRangesProvider = new BracketRangesProvider();

  // Courtesy of vscode-explicit-fold,
  // apparently if you delay the folding provider by a second, it can override the default language folding provider.
  setTimeout(() => {
    context.subscriptions.push(languages.registerFoldingRangeProvider("typescript", bracketRangesProvider));
    foldingDecorator.registerFoldingRangeProvider("typescript", bracketRangesProvider);
  }, 1000);

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(CONFIG_ID)) restart();
    }),
    window.onDidChangeVisibleTextEditors(() => {
      setTimeout(async () => {
        bracketRangesProvider.updateAllDocuments();
        foldingDecorator.triggerUpdateDecorations();
      }, 150);
    }),
    workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length > 0) bracketRangesProvider.provideFoldingRanges(e.document);
    }),
    window.onDidChangeTextEditorVisibleRanges((e) => {
      foldingDecorator.triggerUpdateDecorations(e.textEditor);
    })
  );

  function restart() {
    bracketRangesProvider.restart();

    foldingDecorator.dispose();
    foldingDecorator = new FoldingDecorator();
    foldingDecorator.registerFoldingRangeProvider("typescript", bracketRangesProvider);
  }

  bracketRangesProvider.updateAllDocuments();
  foldingDecorator.triggerUpdateDecorations();
}

export function deactivate() {
  foldingDecorator.dispose();
}
