import { DecorationRenderOptions, Range, TextDocument, TextEditorDecorationType, window } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";

const DEFAULT_COLLAPSED_TEXT = "…";

export default class FoldingDecorator {
  timeout: NodeJS.Timer | undefined = undefined;
  providers: Record<string, BetterFoldingRangeProvider[]> = {};
  decorations: TextEditorDecorationType[] = [];
  unfoldedDecoration = window.createTextEditorDecorationType({});

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
      }, 100);
    }
  }

  private updateDecorations() {
    let activeEditor = window.activeTextEditor;
    if (!activeEditor) return;

    this.clearDecorations();

    const foldingRanges = this.getRanges(activeEditor.document);
    const decorationOptions = this.createDecorationsOptions(foldingRanges);
    this.decorations = this.applyDecorations(foldingRanges, decorationOptions);
  }

  private clearDecorations() {
    this.decorations.forEach((decoration) => decoration.dispose());
    this.unfoldedDecoration.dispose();
  }

  private getRanges(document: TextDocument): BetterFoldingRange[] {
    const ranges: BetterFoldingRange[] = [];

    const providers = this.providers[document.languageId] ?? [];
    for (const provider of providers) {
      const providerRanges = provider.provideFoldingRanges(document);
      ranges.push(...providerRanges);
    }

    return ranges;
  }

  private createDecorationsOptions(foldingRanges: BetterFoldingRange[]): DecorationRenderOptions[] {
    const decorations: Record<string, DecorationRenderOptions> = {};

    for (const foldingRange of foldingRanges) {
      const collapsedText = foldingRange.collapsedText ?? DEFAULT_COLLAPSED_TEXT;
      if (!(collapsedText in decorations)) {
        decorations[collapsedText] = this.newDecorationOption(collapsedText);
      }
    }

    return Object.values(decorations);
  }

  private newDecorationOption(contentText: string): DecorationRenderOptions {
    return {
      textDecoration: "none; display:none;", //Hides the folded text
      after: {
        contentText,
        color: "rgba(255, 255, 255, 0.5)", //TODO: Get this from the theme
        margin: `0 -${100}% 0 0`, //Hides the original collapsed text '…'
        textDecoration: "none; cursor: pointer !important;",
      },
    };
  }

  private applyDecorations(
    foldingRanges: BetterFoldingRange[],
    decorationOptions: DecorationRenderOptions[]
  ): TextEditorDecorationType[] {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) return [];

    const collapsedTextToFoldingRanges: Record<string, BetterFoldingRange[]> = {};
    for (const foldingRange of foldingRanges) {
      const collapsedText = foldingRange.collapsedText ?? DEFAULT_COLLAPSED_TEXT;
      if (!(collapsedText in collapsedTextToFoldingRanges)) {
        collapsedTextToFoldingRanges[collapsedText] = [];
      }

      collapsedTextToFoldingRanges[collapsedText].push(foldingRange);
    }

    const decorations: TextEditorDecorationType[] = [];

    const unfoldedRanges: Range[] = [];
    for (const decorationOption of decorationOptions) {
      const decoration = window.createTextEditorDecorationType(decorationOption);
      decorations.push(decoration);

      const foldingRanges = collapsedTextToFoldingRanges[decorationOption.after!.contentText!];
      const ranges: Range[] = foldingRanges.map(this.foldingRangeToRange(activeEditor.document));

      const foldedRanges: Range[] = [];
      for (const range of ranges) {
        if (this.isFolded(range)) foldedRanges.push(range);
        else unfoldedRanges.push(range);
      }

      activeEditor.setDecorations(decoration, foldedRanges);
    }
    activeEditor.setDecorations(this.unfoldedDecoration, unfoldedRanges);

    return decorations;
  }

  private foldingRangeToRange(document: TextDocument): (foldingRange: BetterFoldingRange) => Range {
    return (foldingRange) =>
      new Range(
        foldingRange.start,
        foldingRange.startColumn ?? document.lineAt(foldingRange.start).text.length,
        foldingRange.end,
        document.lineAt(foldingRange.end).text.length
      );
  }

  private isFolded(range: Range): boolean {
    let activeEditor = window.activeTextEditor;
    if (!activeEditor) return false;

    for (let i = 0; i < activeEditor.visibleRanges.length - 1; i++) {
      const visibleRange = activeEditor.visibleRanges[i];
      if (visibleRange.end.line === range.start.line) return true;
    }
    return false;
  }
}
