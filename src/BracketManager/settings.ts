import TextMateLoader from "./textMateLoader";

export default class Settings {
  public readonly TextMateLoader = new TextMateLoader();
  public readonly excludedLanguages: Set<string>;
  public isDisposed = false;
  constructor() {
    // const configuration = vscode.workspace.getConfiguration("bracket-pair-colorizer-2", undefined);
    // const excludedLanguages = configuration.get("excludedLanguages") as string[];
    // if (!Array.isArray(excludedLanguages)) {
    //   throw new Error("excludedLanguages is not an array");
    // }

    this.excludedLanguages = new Set([]);
  }
}
