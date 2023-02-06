import {
  commands,
  Disposable,
  Position,
  Range,
  Selection,
  TextDocumentChangeEvent,
  TextEditor,
  TextEditorDecorationType,
  window,
} from "vscode";
import { DEFAULT_COLLAPSED_TEXT } from "./constants";
import { BookmarksManager } from "./utils/classes/bookmarksManager";
import FoldedLinesManager from "./utils/classes/foldedLinesManager";
import newDecorationOptions from "./utils/functions/newDecorationOptions";

export default class ZenFoldingDecorator extends Disposable {
  private timeout: NodeJS.Timer | undefined = undefined;
  private zenFoldingDecoration: TextEditorDecorationType;
  private bookmarksManager = new BookmarksManager();

  constructor() {
    super(() => this.dispose());
    this.zenFoldingDecoration = window.createTextEditorDecorationType(newDecorationOptions(DEFAULT_COLLAPSED_TEXT));
  }

  public onChange(change: TextDocumentChangeEvent) {
    this.bookmarksManager.onChange(change);
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

  //TODO: clean this up
  private updateEditorDecorations(editor: TextEditor) {
    editor.setDecorations(this.zenFoldingDecoration, []);
    if (!editor.visibleRanges.length) return;

    const zenLines = this.bookmarksManager.bookmarks.map((b) => b.line);

    const lastVisibleLine = editor.visibleRanges[editor.visibleRanges.length - 1].end.line;
    const cachedFoldedLines = FoldedLinesManager.getFoldedLines(editor);

    const zenFoldedLines = zenLines.filter((line) => cachedFoldedLines?.includes(line) || line === lastVisibleLine);
    const decorationRanges = zenFoldedLines.map(
      (line) => new Range(line, 0, line, editor.document.lineAt(line).text.length)
    );

    editor.setDecorations(this.zenFoldingDecoration, decorationRanges);
  }

  //TODO: clean this up
  public async createZenFoldsAroundSelection() {
    const editor = window.activeTextEditor;
    if (!editor) return;
    const { document } = editor;

    const originalSelection = editor.selection;

    const selectionsToFold: Selection[] = [];

    if (originalSelection.start.line > 0) {
      const firstLine = 0;
      let lastLine = originalSelection.start.line - 1;
      while (lastLine > firstLine + 1 && document.lineAt(lastLine).text.length === 0) lastLine--;

      const selectionAbove = new Selection(firstLine, 0, lastLine, document.lineAt(lastLine).text.length);

      selectionsToFold.push(selectionAbove);
    }

    if (originalSelection.end.line < document.lineCount - 1) {
      let firstLine = originalSelection.end.line + 1;
      const lastLine = document.lineCount - 1;
      while (firstLine < lastLine - 1 && document.lineAt(firstLine).text.length === 0) firstLine++;

      const selectionAbove = new Selection(firstLine, 0, lastLine, document.lineAt(lastLine).text.length);
      selectionsToFold.push(selectionAbove);
    }

    editor.selections = selectionsToFold;

    for (const selection of selectionsToFold) {
      const firstLine = selection.start.line;
      const endOfFirstLinePosition = new Position(firstLine, document.lineAt(firstLine).text.length);
      this.bookmarksManager.addBookmark(editor, endOfFirstLinePosition);
    }

    await commands.executeCommand("editor.createFoldingRangeFromSelection");

    editor.selection = originalSelection;
  }

  public async clearZenFolds() {
    const editor = window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;

    const manualFoldsSelections = this.bookmarksManager.bookmarks.map((b) => new Selection(b.line, 0, b.line, 0));
    editor.selections = manualFoldsSelections;
    await commands.executeCommand("editor.removeManualFoldingRanges");
    this.bookmarksManager.bookmarks = [];
    editor.setDecorations(this.zenFoldingDecoration, []);

    editor.selection = selection;
    await commands.executeCommand("revealLine", { lineNumber: selection.start.line, at: "center" });
  }

  public dispose() {
    this.zenFoldingDecoration.dispose();
  }
}
