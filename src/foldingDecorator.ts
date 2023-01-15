import {
  DecorationRenderOptions,
  Disposable,
  Range,
  TextDocument,
  TextEditor,
  TextEditorDecorationType,
  window,
} from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import { foldingRangeToRange, groupArrayToMap } from "./utils";

const DEFAULT_COLLAPSED_TEXT = "…";

export default class FoldingDecorator extends Disposable {
  timeout: NodeJS.Timer | undefined = undefined;
  providers: Record<string, BetterFoldingRangeProvider[]> = {};
  decorations: TextEditorDecorationType[] = [];
  unfoldedDecoration = window.createTextEditorDecorationType({});

  //TODO: do a per text editor cache
  cachedFoldedLines: number[] = [];

  constructor() {
    super(() => this.clearDecorations());
  }

  public registerFoldingRangeProvider(selector: string, provider: BetterFoldingRangeProvider) {
    if (!this.providers[selector]) {
      this.providers[selector] = [];
    }

    this.providers[selector].push(provider);
  }

  public triggerUpdateDecorations(clearCache = false) {
    let activeEditor = window.activeTextEditor;
    if (!activeEditor) return;

    if (!this.timeout) {
      if (clearCache) this.clearCache();
      this.updateDecorations(activeEditor);

      this.timeout = setTimeout(() => {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      }, 100);
    }
  }

  private updateDecorations(activeEditor: TextEditor) {
    this.clearDecorations();

    this.cacheFoldedLines(activeEditor.visibleRanges);

    const foldingRanges = this.getRanges(activeEditor.document);
    const decorationOptions = this.createDecorationsOptions(foldingRanges);
    this.decorations = this.applyDecorations(activeEditor, foldingRanges, decorationOptions);
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
      before: {
        //Apparently if you add width and height (any values), the text will be clickable
        width: "0",
        height: "0",
        contentText,
        color: "rgba(255, 255, 255, 0.5)", //TODO: Get this from the theme
        margin: `0 -${100}% 0 0`, //Hides the original collapsed text '…'
        textDecoration: "none; cursor: pointer !important;",
      },
    };
  }

  private applyDecorations(
    activeEditor: TextEditor,
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
      const ranges: Range[] = foldingRanges.map(foldingRangeToRange(activeEditor.document));

      const foldedRanges: Range[] = [];
      for (const range of ranges) {
        if (this.isFolded(range.start.line)) foldedRanges.push(range);
        else unfoldedRanges.push(range);
      }

      activeEditor.setDecorations(decoration, foldedRanges);
    }
    activeEditor.setDecorations(this.unfoldedDecoration, unfoldedRanges);

    return decorations;
  }

  private isFolded(line: number): boolean {
    for (const cachedFoldedLine of this.cachedFoldedLines) {
      if (cachedFoldedLine === line) return true;
    }
    return false;
  }

  private cacheFoldedLines(visibleRanges: readonly Range[]) {
    if (visibleRanges.length === 0) return;

    if (this.cachedFoldedLines.length === 0) {
      this.cachedFoldedLines = visibleRanges.slice(0, -1).map((range) => range.end.line);
      return;
    }

    const currentFoldedLines = visibleRanges.slice(0, -1).map((range) => range.end.line);
    const newFoldedLines = currentFoldedLines.filter((line) => !this.cachedFoldedLines.includes(line));
    this.cachedFoldedLines.push(...newFoldedLines);
    this.cachedFoldedLines.sort((a, b) => a - b); //TODO: Optimize this by inserting lines in the right place.

    const currentFoldedLinesSet = new Set(currentFoldedLines);
    this.cachedFoldedLines = this.cachedFoldedLines.filter(
      (line) =>
        currentFoldedLinesSet.has(line) ||
        line <= visibleRanges[0].start.line ||
        line >= visibleRanges[visibleRanges.length - 1].end.line
    );
  }

  private clearCache() {
    this.cachedFoldedLines = [];
  }
}
