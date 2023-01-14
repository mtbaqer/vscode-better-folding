import { ExtensionContext, languages, window } from "vscode";
import { BracketRangesProvider } from "./bracketRangesProvider";
import FoldingDecorator from "./foldingDecorator";

export function activate(context: ExtensionContext) {
  const foldingDecorator = new FoldingDecorator();
  context.subscriptions.push(foldingDecorator);

  // Courtesy of vscode-explicit-fold,
  // apparently if you delay the folding provider by a second, it can override the default language folding provider.
  setTimeout(() => {
    const bracketRangesProvider = new BracketRangesProvider();
    context.subscriptions.push(languages.registerFoldingRangeProvider("typescript", bracketRangesProvider));
    foldingDecorator.registerFoldingRangeProvider("typescript", bracketRangesProvider);
  }, 1000);

  context.subscriptions.push(
    window.onDidChangeTextEditorVisibleRanges((e) => {
      if (e) foldingDecorator.triggerUpdateDecorations();
    })
  );

  foldingDecorator.triggerUpdateDecorations();
}

export function deactivate() {}
