import { ExtensionContext, languages, window, workspace } from "vscode";
import { BracketRangesProvider } from "./bracketRangesProvider";
import { CONFIG_ID } from "./configuration";
import FoldingDecorator from "./foldingDecorator";
import * as config from "./configuration";

const bracketRangesProvider = new BracketRangesProvider();
let foldingDecorator = new FoldingDecorator([bracketRangesProvider]);

const registeredLanguages = new Set<string>();

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    foldingDecorator,

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

// Courtesy of vscode-explicit-fold,
// apparently if you delay the folding provider by a second, it can override the default language folding provider.
function registerProviders(context: ExtensionContext, delay = 0) {
  const excludedLanguages = config.excludedLanguages();

  for (const editor of window.visibleTextEditors) {
    const languageId = editor.document.languageId;

    if (!registeredLanguages.has(languageId) && !excludedLanguages.includes(languageId)) {
      registeredLanguages.add(languageId);

      setTimeout(() => {
        context.subscriptions.push(languages.registerFoldingRangeProvider(languageId, bracketRangesProvider));
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
