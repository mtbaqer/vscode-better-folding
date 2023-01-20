import { ExtensionContext, languages, window, workspace } from "vscode";
import { BracketRangesProvider } from "./bracketRangesProvider";
import { CONFIG_ID } from "./configuration";
import FoldingDecorator from "./foldingDecorator";

const bracketRangesProvider = new BracketRangesProvider();
let foldingDecorator = new FoldingDecorator([bracketRangesProvider]);

const registeredLanguages = new Set<string>();

export function activate(context: ExtensionContext) {
  context.subscriptions.push(foldingDecorator);

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(CONFIG_ID)) restart();
    }),
    window.onDidChangeVisibleTextEditors(() => {
      updateAllDocuments();
      registerProviders(context);
    }),
    workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length > 0) bracketRangesProvider.provideFoldingRanges(e.document);
    }),
    window.onDidChangeTextEditorVisibleRanges((e) => {
      foldingDecorator.triggerUpdateDecorations(e.textEditor);
    })
  );

  registerProviders(context, 1000);
  updateAllDocuments();
}

function registerProviders(context: ExtensionContext, delay = 0) {
  // Courtesy of vscode-explicit-fold,
  // apparently if you delay the folding provider by a second, it can override the default language folding provider.
  for (const editor of window.visibleTextEditors) {
    if (!registeredLanguages.has(editor.document.languageId)) {
      registeredLanguages.add(editor.document.languageId);
      setTimeout(() => {
        context.subscriptions.push(
          languages.registerFoldingRangeProvider(editor.document.languageId, bracketRangesProvider)
        );
      }, delay);
    }
  }
}

function updateAllDocuments() {
  //Delayed since vscode does not provide the right visible ranges right away when opening a new document.
  bracketRangesProvider.updateAllDocuments();
  setTimeout(async () => {
    foldingDecorator.triggerUpdateDecorations();
  }, 500);
}

function restart() {
  bracketRangesProvider.restart();

  foldingDecorator.dispose();
  foldingDecorator = new FoldingDecorator([bracketRangesProvider]);
}

export function deactivate() {
  foldingDecorator.dispose();
}
