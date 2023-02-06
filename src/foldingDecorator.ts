import {
  DecorationRenderOptions,
  Disposable,
  Range,
  TextDocument,
  TextEditor,
  TextEditorDecorationType,
  Uri,
  window,
} from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider, ProvidersList } from "./types";
import ExtendedMap from "./utils/classes/extendedMap";
import { foldingRangeToRange, groupArrayToMap, rangeToInlineRange } from "./utils/utils";
import * as config from "./configuration";
import FoldedLinesManager from "./foldedLinesManager";
import newDecorationOptions from "./utils/newDecorationOptions";

const DEFAULT_COLLAPSED_TEXT = "…";

export default class FoldingDecorator extends Disposable {
  timeout: NodeJS.Timer | undefined = undefined;
  providers: Record<string, BetterFoldingRangeProvider[]> = {};
  unfoldedDecoration = window.createTextEditorDecorationType({});

  decorations: ExtendedMap<Uri, TextEditorDecorationType[]> = new ExtendedMap(() => []);

  constructor(providers: ProvidersList) {
    super(() => this.dispose());
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

  public triggerUpdateDecorations(editor?: TextEditor) {
    if (!this.timeout) {
      this.updateDecorations(editor);

      this.timeout = setTimeout(() => {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }, 100);
    }
  }

  private updateDecorations(editor?: TextEditor) {
    if (editor) this.updateEditorDecorations(editor);
    else {
      for (const editor of window.visibleTextEditors) {
        this.updateEditorDecorations(editor);
      }
    }
  }

  private async updateEditorDecorations(editor: TextEditor) {
    const foldingRanges = await this.getRanges(editor.document);
    this.clearDecorations(editor);

    const decorationOptions = this.createDecorationsOptions(foldingRanges);
    const newDecorations = this.applyDecorations(editor, foldingRanges, decorationOptions);
    this.setDecorations(editor, newDecorations);
  }

  private clearDecorations(editor?: TextEditor) {
    if (editor) {
      for (const decoration of this.getDecorations(editor)) {
        decoration.dispose();
      }
      editor.setDecorations(this.unfoldedDecoration, []);
    } else {
      for (const decorations of this.decorations.values()) {
        decorations.forEach((decoration) => decoration.dispose());
      }
      this.unfoldedDecoration.dispose();
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
      const providerRanges = await provider.provideFoldingRanges(document, undefined, undefined, true);
      ranges.push(...providerRanges);
    }

    return ranges;
  }

  private createDecorationsOptions(foldingRanges: BetterFoldingRange[]): DecorationRenderOptions[] {
    const decorations: Record<string, DecorationRenderOptions> = {};

    for (const foldingRange of foldingRanges) {
      const collapsedText = foldingRange.collapsedText ?? DEFAULT_COLLAPSED_TEXT;
      if (!(collapsedText in decorations)) {
        decorations[collapsedText] = newDecorationOptions(collapsedText);
      }
    }

    return Object.values(decorations);
  }

  private applyDecorations(
    editor: TextEditor,
    foldingRanges: BetterFoldingRange[],
    decorationOptions: DecorationRenderOptions[]
  ): TextEditorDecorationType[] {
    const collapsedTextToFoldingRanges = groupArrayToMap(foldingRanges, (foldingRange) => foldingRange.collapsedText);

    const decorations: TextEditorDecorationType[] = [];

    const unfoldedRanges: Range[] = [];
    for (const decorationOption of decorationOptions) {
      const decoration = window.createTextEditorDecorationType(decorationOption);
      decorations.push(decoration);

      const foldingRanges = collapsedTextToFoldingRanges.get(decorationOption.before!.contentText!)!;
      const ranges: Range[] = foldingRanges.map(foldingRangeToRange(editor.document));

      const foldedRanges: Range[] = [];
      for (const range of ranges) {
        if (FoldedLinesManager.isFolded(range, editor)) foldedRanges.push(range);
        else unfoldedRanges.push(range);
      }

      const inlineFoldedRanges = foldedRanges.map(rangeToInlineRange(editor.document));

      editor.setDecorations(decoration, inlineFoldedRanges);
    }
    editor.setDecorations(this.unfoldedDecoration, unfoldedRanges);

    return decorations;
  }

  private getDecorations(editor: TextEditor): TextEditorDecorationType[] {
    return this.decorations.get(editor.document.uri);
  }

  private setDecorations(editor: TextEditor, decorations: TextEditorDecorationType[]) {
    this.decorations.set(editor.document.uri, decorations);
  }

  public dispose() {
    this.clearDecorations();
  }
}
