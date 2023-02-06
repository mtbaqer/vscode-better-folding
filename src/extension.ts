import { commands, ExtensionContext, languages, window, workspace } from "vscode";
import { BracketRangesProvider } from "./bracketRangesProvider";
import { CONFIG_ID } from "./configuration";
import FoldingDecorator from "./foldingDecorator";
import * as config from "./configuration";
import RegionRangesProvider from "./regionRangesProvider";
import JsxRangesProvider from "./jsxRangesProvider";
import FoldedLinesManager from "./foldedLinesManager";
import ZenFoldingDecorator from "./zenFoldingDecorator";

const bracketRangesProvider = new BracketRangesProvider();
const regionProvider = new RegionRangesProvider();
const jsxRangesProvider = new JsxRangesProvider();
let foldingDecorator = new FoldingDecorator([bracketRangesProvider, regionProvider]);

foldingDecorator.registerFoldingRangeProvider("javascriptreact", jsxRangesProvider);
foldingDecorator.registerFoldingRangeProvider("typescriptreact", jsxRangesProvider);

let zenFoldingDecorator = new ZenFoldingDecorator();

const registeredLanguages = new Set<string>();

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    foldingDecorator,

    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(CONFIG_ID)) restart();
    }),

    window.onDidChangeVisibleTextEditors(() => {
      updateAllDocuments();
      registerProviders(context, 2000);
    }),

    workspace.onDidChangeTextDocument((e) => {
      zenFoldingDecorator.onChange(e);
      jsxRangesProvider.provideFoldingRanges(e.document);
      bracketRangesProvider.provideFoldingRanges(e.document);
    }),

    window.onDidChangeTextEditorVisibleRanges((e) => {
      FoldedLinesManager.updateFoldedLines(e.textEditor);
      zenFoldingDecorator.triggerUpdateDecorations(e.textEditor);
      foldingDecorator.triggerUpdateDecorations(e.textEditor);
    })
  );

  registerProviders(context, 2000);
  updateAllDocuments();

  //TODO: clean this up.
  const createZenFoldsAroundSelection = "betterFolding.createZenFoldsAroundSelection";
  context.subscriptions.push(
    commands.registerCommand(createZenFoldsAroundSelection, () => zenFoldingDecorator.createZenFoldsAroundSelection())
  );

  const clearZenFolds = "betterFolding.clearZenFolds";
  context.subscriptions.push(commands.registerCommand(clearZenFolds, () => zenFoldingDecorator.clearZenFolds()));
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
        if (languageId === "javascriptreact" || languageId === "typescriptreact") {
          context.subscriptions.push(languages.registerFoldingRangeProvider(languageId, jsxRangesProvider));
        }
      }, delay);
    }
  }
}

function updateAllDocuments() {
  //Delayed since vscode does not provide the right visible ranges right away when opening a new document.
  bracketRangesProvider.updateAllDocuments();
  setTimeout(async () => {
    FoldedLinesManager.updateAllFoldedLines();
    zenFoldingDecorator.triggerUpdateDecorations();
    foldingDecorator.triggerUpdateDecorations();
  }, 500);
}

function restart() {
  bracketRangesProvider.restart();

  foldingDecorator.dispose();
  foldingDecorator = new FoldingDecorator([bracketRangesProvider, regionProvider]);

  foldingDecorator.registerFoldingRangeProvider("javascriptreact", jsxRangesProvider);
  foldingDecorator.registerFoldingRangeProvider("typescriptreact", jsxRangesProvider);
}

export function deactivate() {
  foldingDecorator.dispose();
  zenFoldingDecorator.dispose();
}
