import { Range, TextEditor, Uri, window } from "vscode";
import ExtendedMap from "./extendedMap";

/**
 * Util class to manage folded lines since vscode does not provide a way to tell if a line is folded or not.
 */
class FoldedLinesManager {
  //Singleton
  private static _instance: FoldedLinesManager;
  public static get instance(): FoldedLinesManager {
    this._instance = this._instance ? this._instance : new FoldedLinesManager();
    return this._instance;
  }

  private cachedFoldedLines: ExtendedMap<Uri, number[]> = new ExtendedMap(() => []);

  public updateAllFoldedLines() {
    for (const editor of window.visibleTextEditors) {
      this.updateFoldedLines(editor);
    }
  }

  public updateFoldedLines(editor: TextEditor) {
    const { visibleRanges } = editor;
    if (visibleRanges.length === 0) return;
    let cachedLines = this.getFoldedLines(editor);
    const currentFoldedLines = visibleRanges.slice(0, -1).map((range) => range.end.line);

    if (cachedLines.length === 0) {
      this.setFoldedLines(editor, currentFoldedLines);
      return;
    }

    cachedLines = this.matchFoldedLines(cachedLines, currentFoldedLines);
    cachedLines = this.matchUnfoldedLines(cachedLines, currentFoldedLines, visibleRanges);

    this.setFoldedLines(editor, cachedLines);
  }

  private matchFoldedLines(cachedLines: number[], currentFoldedLines: number[]) {
    const newFoldedLines = currentFoldedLines.filter((line) => !cachedLines.includes(line));
    cachedLines.push(...newFoldedLines);
    cachedLines.sort((a, b) => a - b);
    return cachedLines;
  }

  private matchUnfoldedLines(cachedLines: number[], currentFoldedLines: number[], visibleRanges: readonly Range[]) {
    const foldedLinesSet = new Set(currentFoldedLines);
    const isOutsideViewport = (line: number) =>
      line < visibleRanges[0].start.line || line >= visibleRanges.at(-1)!.end.line;
    return cachedLines.filter((line) => foldedLinesSet.has(line) || isOutsideViewport(line));
  }

  public isFolded(range: Range, editor: TextEditor): boolean {
    for (const cachedFoldedLine of this.getFoldedLines(editor)) {
      if (cachedFoldedLine === range.start.line) return true;
    }
    return this.checkRangeAtEndOfDocumentCase(range, editor);
  }

  //TODO: clean this up.
  //Band-aid fix because vscode does not provide a visible range if last folded line is the last line in document.
  private checkRangeAtEndOfDocumentCase(range: Range, editor: TextEditor) {
    const lastLine = editor.document.lineCount - 1;
    const justBeforeLastLine = lastLine - 1;
    const rangeAtEndOfDocument = range.end.line === lastLine || range.end.line === justBeforeLastLine;

    const lastVisibleLine = editor.visibleRanges[editor.visibleRanges.length - 1].end.line;

    if (rangeAtEndOfDocument && lastVisibleLine <= range.start.line) {
      this.getFoldedLines(editor).push(range.start.line);
      return true;
    }
    this.setFoldedLines(
      editor,
      this.getFoldedLines(editor).filter((line) => line !== range.start.line)
    );
    return false;
  }

  public getFoldedLines(editor: TextEditor): number[] {
    return this.cachedFoldedLines.get(editor.document.uri);
  }

  private setFoldedLines(editor: TextEditor, lines: number[]) {
    this.cachedFoldedLines.set(editor.document.uri, lines);
  }
}

export default FoldedLinesManager.instance;
