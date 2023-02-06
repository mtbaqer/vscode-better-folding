import { Range, TextEditor, Uri, window } from "vscode";
import ExtendedMap from "./extendedMap";

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
    const cachedLines = this.getFoldedLines(editor);
    const currentFoldedLines = visibleRanges.slice(0, -1).map((range) => range.end.line);

    if (cachedLines.length === 0) {
      this.setFoldedLines(editor, currentFoldedLines);
      return;
    }

    //TODO: Optimize this.
    //Match the folded lines between editor and cached lines.
    const newFoldedLines = currentFoldedLines.filter((line) => !cachedLines.includes(line));
    cachedLines.push(...newFoldedLines);
    cachedLines.sort((a, b) => a - b);

    //Match the unfolded lines between editor and cached lines.
    const currentFoldedLinesSet = new Set(currentFoldedLines);
    const cachedLinesMinusUnfoldedLines = cachedLines.filter(
      (line) =>
        currentFoldedLinesSet.has(line) ||
        line < visibleRanges[0].start.line ||
        line >= visibleRanges[visibleRanges.length - 1].end.line
    );
    this.setFoldedLines(editor, cachedLinesMinusUnfoldedLines);
  }

  public isFolded(range: Range, editor: TextEditor): boolean {
    for (const cachedFoldedLine of this.getFoldedLines(editor)) {
      if (cachedFoldedLine === range.start.line) return true;
    }
    return this.checkRangeAtEndOfDocumentCase(range, editor);
  }

  //TODO: clean this up.
  //Band-aid fix for now.
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
