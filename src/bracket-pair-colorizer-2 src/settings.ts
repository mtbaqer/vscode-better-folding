import TextMateLoader from "./textMateLoader";
import * as config from "../configuration";

export default class Settings {
  public readonly TextMateLoader = new TextMateLoader();
  public readonly excludedLanguages: Set<string>;
  public isDisposed = false;

  constructor() {
    const excludedLanguages = config.excludedLanguages();
    this.excludedLanguages = new Set(excludedLanguages);
  }
}
