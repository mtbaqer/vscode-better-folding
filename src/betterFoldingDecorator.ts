import { DecorationRenderOptions, Disposable, TextEditor, window } from "vscode";

export default abstract class BetterFoldingDecorator extends Disposable {
  private timeout: NodeJS.Timer | undefined = undefined;

  constructor() {
    super(() => this.dispose());
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

  protected abstract updateEditorDecorations(editor: TextEditor): void;

  //This is how Better Folding is able to provide custom collapsedText.
  protected newDecorationOptions(contentText: string): DecorationRenderOptions {
    return {
      textDecoration: "none; display:none;", //Hides the folded text
      before: {
        //Apparently if you add width and height (any values), the text will be clickable
        width: "0",
        height: "0",
        contentText,
        color: "rgba(255, 255, 255, 0.5)", //TODO: Get this from the theme
        margin: `0 -${90}% 0 0`, //Hides the original collapsed text '…'
        textDecoration: "none; cursor: pointer !important;",
      },
    };
  }
}
