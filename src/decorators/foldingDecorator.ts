import { Range, TextDocument, TextEditor, Uri, window } from "vscode";
import { BetterFoldingRange, DecorationsRecord, ProvidersList } from "../types";
import ExtendedMap from "../utils/classes/extendedMap";
import { foldingRangeToRange, groupArrayToMap, rangeToInlineRange } from "../utils/functions/utils";
import * as config from "../configuration";
import FoldedLinesManager from "../utils/classes/foldedLinesManager";
import { DEFAULT_COLLAPSED_TEXT } from "../constants";
import BetterFoldingDecorator from "./betterFoldingDecorator";
import BetterFoldingRangeProvider from "../providers/betterFoldingRangeProvider";

export default class FoldingDecorator extends BetterFoldingDecorator {
  providers: Record<string, BetterFoldingRangeProvider[]> = {};
  decorations: ExtendedMap<Uri, DecorationsRecord> = new ExtendedMap(() => ({}));

  constructor(providers: ProvidersList) {
    super();
    for (const [selector, provider] of providers) {
      this.registerFoldingRangeProvider(selector, provider);
    }
  }

  public registerFoldingRangeProvider(selector: string, provider: BetterFoldingRangeProvider) {
    if (!this.providers[selector]) {
      this.providers[selector] = [];
    }

    this.providers[selector].push(provider);
  }

  protected async updateEditorDecorations(editor: TextEditor) {
    const foldingRanges = await this.getRanges(editor.document);

    const newDecorations = this.addToDecorations(foldingRanges, this.getDecorations(editor));
    this.applyDecorations(editor, foldingRanges, newDecorations);
  }

  private clearDecorations() {
    for (const decorations of this.decorations.values()) {
      for (const decoration of Object.values(decorations)) {
        decoration.dispose();
      }
    }
  }

  private async getRanges(document: TextDocument): Promise<BetterFoldingRange[]> {
    const excludedLanguages = config.excludedLanguages();
    if (excludedLanguages.includes(document.languageId)) return [];

    const ranges: BetterFoldingRange[] = [];

    const languageProviders = this.providers[document.languageId] ?? [];
    const universalProviders = this.providers["*"] ?? [];
    const allProviders = [...languageProviders, ...universalProviders];

    for (const provider of allProviders) {
      const providerRanges = await provider.provideFoldingRanges(document);
      ranges.push(...providerRanges);
    }

    return ranges;
  }

  private addToDecorations(foldingRanges: BetterFoldingRange[], decorations: DecorationsRecord): DecorationsRecord {
    for (const foldingRange of foldingRanges) {
      const collapsedText = foldingRange.collapsedText ?? DEFAULT_COLLAPSED_TEXT;
      if (!(collapsedText in decorations)) {
        const newDecorationOptions = this.newDecorationOptions(collapsedText);
        decorations[collapsedText] = window.createTextEditorDecorationType(newDecorationOptions);
      }
    }

    return decorations;
  }

  private applyDecorations(editor: TextEditor, foldingRanges: BetterFoldingRange[], decorations: DecorationsRecord) {
    const collapsedTextToFoldingRanges = groupArrayToMap(
      foldingRanges,
      (foldingRange) => foldingRange.collapsedText,
      DEFAULT_COLLAPSED_TEXT
    );

    const unfoldedRanges: Range[] = [];
    for (const [collapsedText, decoration] of Object.entries(decorations)) {
      const foldingRanges = collapsedTextToFoldingRanges.get(collapsedText)!;
      if (!foldingRanges) continue;
      const ranges: Range[] = foldingRanges.map(foldingRangeToRange(editor.document));

      const foldedRanges: Range[] = [];
      for (const range of ranges) {
        if (FoldedLinesManager.isFolded(range, editor)) foldedRanges.push(range);
        else unfoldedRanges.push(range);
      }

      const inlineFoldedRanges = foldedRanges.map(rangeToInlineRange(editor.document));

      editor.setDecorations(decoration, inlineFoldedRanges);
    }
  }

  private getDecorations(editor: TextEditor): DecorationsRecord {
    return this.decorations.get(editor.document.uri);
  }

  public dispose() {
    this.clearDecorations();
  }
}
