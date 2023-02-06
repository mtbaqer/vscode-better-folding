import { DecorationRenderOptions } from "vscode";

//This is how Better Folding is able to provide custom collapsedText.
export default function newDecorationOptions(contentText: string): DecorationRenderOptions {
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
