import { TextDocument, window } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";

export default class FoldingDecorator {
  timeout: NodeJS.Timer | undefined = undefined;
  providers: Record<string, BetterFoldingRangeProvider[]> = {};

  constructor() {}

  public registerFoldingRangeProvider(selector: string, provider: BetterFoldingRangeProvider) {
    if (!this.providers[selector]) {
      this.providers[selector] = [];
    }

    this.providers[selector].push(provider);
  }

  public triggerUpdateDecorations() {
    if (!this.timeout) {
      this.updateDecorations();

      this.timeout = setTimeout(() => {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }, 1000);
    }
  }

  private updateDecorations() {
    let activeEditor = window.activeTextEditor;
    if (!activeEditor) return;

    const foldingRanges = this.getFoldingRanges(activeEditor.document);
  }

  private getFoldingRanges(document: TextDocument): BetterFoldingRange[] {
    const ranges: BetterFoldingRange[] = [];

    const providers = this.providers[document.languageId] ?? [];
    for (const provider of providers) {
      const providerRanges = provider.provideFoldingRanges(document);
      ranges.push(...providerRanges);
    }

    return ranges;
  }
}
