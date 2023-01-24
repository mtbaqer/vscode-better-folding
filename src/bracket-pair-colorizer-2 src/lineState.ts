import { Position } from "vscode";
import Bracket from "./bracket";
import BracketClose from "./bracketClose";
import IBracketManager from "./IBracketManager";
import LanguageConfig from "./languageConfig";
import Settings from "./settings";
import SingularBracketGroup from "./singularIndex";
import Token from "./token";

export default class LineState {
  private readonly bracketManager: IBracketManager;
  private readonly settings: Settings;
  private readonly languageConfig: LanguageConfig;
  private readonly tokens: Token[];

  constructor(
    settings: Settings,
    languageConfig: LanguageConfig,
    previousState?: {
      readonly colorIndexes: IBracketManager;
      readonly tokens: Token[];
    }
  ) {
    this.settings = settings;
    this.languageConfig = languageConfig;

    if (previousState !== undefined) {
      this.bracketManager = previousState.colorIndexes;
      this.tokens = previousState.tokens;
    } else {
      this.bracketManager = new SingularBracketGroup(settings);
      this.tokens = [];
    }
  }

  public getBracketHash() {
    return this.bracketManager.getHash();
  }

  public cloneState(): LineState {
    const clone = {
      colorIndexes: this.bracketManager.copyCumulativeState(),
      tokens: [...this.tokens],
    };

    return new LineState(this.settings, this.languageConfig, clone);
  }

  public getClosingBracket(position: Position): BracketClose | undefined {
    return this.bracketManager.getClosingBracket(position);
  }

  public offset(startIndex: number, amount: number) {
    //TODO: do this for tokens as well.
    this.bracketManager.offset(startIndex, amount);
  }

  public addBracket(type: number, character: string, beginIndex: number, lineIndex: number, open: boolean) {
    const token = new Token(type, character, beginIndex, lineIndex);
    if (open) {
      this.addOpenBracket(token);
    } else {
      this.addCloseBracket(token);
    }
  }

  public getAllBrackets(): Bracket[] {
    return this.bracketManager.getAllBrackets();
  }

  private addOpenBracket(token: Token) {
    this.bracketManager.addOpenBracket(token);
  }

  private addCloseBracket(token: Token) {
    this.bracketManager.addCloseBracket(token);
  }

  public addToken(token: Token) {
    this.tokens.push(token);
  }

  public getAllTokens(): Token[] {
    return this.tokens;
  }
}
