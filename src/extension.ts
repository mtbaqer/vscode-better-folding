import { commands, ExtensionContext, languages, window, workspace } from "vscode";
import { BracketRangesProvider } from "./providers/bracketRangesProvider";
import { CLEAR_ZEN_FOLDS_COMMAND, CONFIG_ID, CREATE_ZEN_FOLDS_COMMAND } from "./constants";
import FoldingDecorator from "./decorators/foldingDecorator";
import * as config from "./configuration";
import RegionRangesProvider from "./providers/regionRangesProvider";
import JsxRangesProvider from "./providers/jsxRangesProvider";
import FoldedLinesManager from "./utils/classes/foldedLinesManager";
import ZenFoldingDecorator from "./decorators/zenFoldingDecorator";
import { ProvidersList } from "./types";
import BetterFoldingRangeProvider from "./providers/betterFoldingRangeProvider";

const bracketRangesProvider = new BracketRangesProvider();
const providers: ProvidersList = [
  ["*", bracketRangesProvider],
  ["*", new RegionRangesProvider()],
  ["javascriptreact", new JsxRangesProvider()],
  ["typescriptreact", new JsxRangesProvider()],
];

let foldingDecorator = new FoldingDecorator(providers);
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
      registerProviders(context);
    }),

    workspace.onDidChangeTextDocument((e) => {
      zenFoldingDecorator.onChange(e);
      providers.forEach(([_, provider]) => provider.updateRanges(e.document));
    }),

    window.onDidChangeTextEditorVisibleRanges((e) => {
      FoldedLinesManager.updateFoldedLines(e.textEditor);
      zenFoldingDecorator.triggerUpdateDecorations(e.textEditor);
      foldingDecorator.triggerUpdateDecorations(e.textEditor);
    }),

    commands.registerCommand(CREATE_ZEN_FOLDS_COMMAND, () => zenFoldingDecorator.createZenFoldsAroundSelection()),
    commands.registerCommand(CLEAR_ZEN_FOLDS_COMMAND, () => zenFoldingDecorator.clearZenFolds())
  );

  registerProviders(context);
  updateAllDocuments();
}

function registerProviders(context: ExtensionContext) {
  const excludedLanguages = config.excludedLanguages();

  for (const editor of window.visibleTextEditors) {
    const languageId = editor.document.languageId;

    if (!registeredLanguages.has(languageId) && !excludedLanguages.includes(languageId)) {
      registeredLanguages.add(languageId);

      for (const [selector, provider] of providers) {
        if (selector === languageId || selector === "*") registerProvider(context, languageId, provider);
      }
    }
  }
}

// Courtesy of vscode-explicit-fold,
// apparently if you delay the folding provider by a second, it can override the default language folding provider.
function registerProvider(context: ExtensionContext, selector: string, provider: BetterFoldingRangeProvider) {
  setTimeout(() => {
    context.subscriptions.push(languages.registerFoldingRangeProvider(selector, provider));
  }, 2000);
}

function updateAllDocuments() {
  //Delayed since vscode does not provide the right visible ranges right away when opening a new document.
  bracketRangesProvider.updateAllDocuments();
  setTimeout(async () => {
    for (const e of window.visibleTextEditors) {
      providers.forEach(([_, provider]) => provider.updateRanges(e.document));
    }
    FoldedLinesManager.updateAllFoldedLines();
    zenFoldingDecorator.triggerUpdateDecorations();
    foldingDecorator.triggerUpdateDecorations();
  }, 500);
}

function restart() {
  providers.forEach(([_, provider]) => provider.restart());

  foldingDecorator.dispose();
  foldingDecorator = new FoldingDecorator(providers);
}

export function deactivate() {
  foldingDecorator.dispose();
  zenFoldingDecorator.dispose();
}
