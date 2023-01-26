import * as vscode from "vscode";
import BracketClose from "./bracketClose";
import { IStackElement, IToken } from "./IExtensionGrammar";
import LanguageConfig from "./languageConfig";
import LineState from "./lineState";
import Settings from "./settings";
import TextLine from "./textLine";
import { ignoreBracketsInToken, LineTokens } from "./vscodeFiles";
import { TextDocumentContentChangeEvent } from "vscode";
import Bracket from "./bracket";
import Token from "./token";
import { TokenizedDocument } from "../types";

export default class DocumentDecoration {
  public readonly settings: Settings;

  // This program caches lines, and will only analyze linenumbers including or above a modified line
  private lines: TextLine[] = [];
  private readonly document: vscode.TextDocument;
  private readonly languageConfig: LanguageConfig;
  private scopeDecorations: vscode.TextEditorDecorationType[] = [];
  private scopeSelectionHistory: vscode.Selection[][] = [];

  constructor(document: vscode.TextDocument, config: LanguageConfig, settings: Settings) {
    this.settings = settings;
    this.document = document;
    this.languageConfig = config;
  }

  public dispose() {
    this.disposeScopeDecorations();
  }

  public onDidChangeTextDocument(contentChanges: ReadonlyArray<TextDocumentContentChangeEvent>) {
    if (contentChanges.length > 1 || !contentChanges[0].range.isSingleLine || contentChanges[0].text.length > 1) {
      let minLineIndexToUpdate = 0;
      for (const contentChange of contentChanges) {
        minLineIndexToUpdate = Math.min(minLineIndexToUpdate, contentChange.range.start.line);
      }

      if (minLineIndexToUpdate === 0) {
        this.lines = [];
      } else {
        this.lines.splice(minLineIndexToUpdate);
      }
      return this.tokenizeDocument();
    }

    const change = contentChanges[0];

    const lineNumber = change.range.start.line;
    // Parse overlapped lines with goal to see if we can avoid document reparse
    // By just moving existing brackets if the amount of brackets on a line didn't change
    const newLine = this.tokenizeLine(lineNumber);
    const currentLine = this.lines[lineNumber];

    // Current line has new brackets which need to be colored
    if (
      !currentLine.getRuleStack().equals(newLine.getRuleStack()) ||
      currentLine.getBracketHash() !== newLine.getBracketHash()
    ) {
      this.lines[lineNumber] = newLine;
      this.lines.splice(lineNumber + 1);
      this.tokenizeDocument();
      return;
    }

    const charOffset = change.text.length - change.rangeLength;
    currentLine.offset(change.range.start.character, charOffset);
  }

  // Lines are stored in an array, if line is requested outside of array bounds
  // add emptys lines until array is correctly sized
  public getLine(index: number, state: IStackElement): TextLine {
    if (index < this.lines.length) {
      return this.lines[index];
    } else {
      if (this.lines.length === 0) {
        this.lines.push(new TextLine(state, new LineState(this.settings, this.languageConfig), 0));
      }

      if (index < this.lines.length) {
        return this.lines[index];
      }

      if (index === this.lines.length) {
        const previousLine = this.lines[this.lines.length - 1];
        const newLine = new TextLine(state, previousLine.cloneState(), index);

        this.lines.push(newLine);
        return newLine;
      }

      throw new Error("Cannot look more than one line ahead");
    }
  }

  public tokenizeDocument(): TokenizedDocument | undefined {
    // console.log("Tokenizing " + this.document.fileName);

    // One document may be shared by multiple editors (side by side view)
    const editors: vscode.TextEditor[] = vscode.window.visibleTextEditors.filter((e) => this.document === e.document);

    if (editors.length === 0) {
      // console.warn("No editors associated with document: " + this.document.fileName);
      return;
    }

    // console.time("tokenizeDocument");

    const lineIndex = this.lines.length;
    const lineCount = this.document.lineCount;
    if (lineIndex < lineCount) {
      // console.log("Reparse from line: " + (lineIndex + 1));
      for (let i = lineIndex; i < lineCount; i++) {
        const newLine = this.tokenizeLine(i);
        this.lines.push(newLine);
      }
    }

    const brackets: Bracket[] = [];
    const tokens: Token[] = [];
    for (const line of this.lines) {
      brackets.push(...line.getAllBrackets());
      tokens.push(...line.getAllTokens());
    }

    return { brackets, tokens };
  }

  private tokenizeLine(index: number) {
    const newText = this.document.lineAt(index).text;
    const previousLineRuleStack = index > 0 ? this.lines[index - 1].getRuleStack() : undefined;

    const previousLineState =
      index > 0 ? this.lines[index - 1].cloneState() : new LineState(this.settings, this.languageConfig);

    //Don't judge, I'm just following the style of the original code
    const tokenized = this.languageConfig.grammar.tokenizeLine(newText, previousLineRuleStack);
    const tokens = tokenized.tokens;
    const startIndexToToken = new Map(tokens.map((token) => [token.startIndex, token]));

    const tokenized2 = this.languageConfig.grammar.tokenizeLine2(newText, previousLineRuleStack);
    const tokens2 = tokenized2.tokens;
    const lineTokens = new LineTokens(tokens2, newText);

    const matches = new Array<{ content: string; index: number }>();
    const count = lineTokens.getCount();
    for (let i = 0; i < count; i++) {
      const tokenType = lineTokens.getStandardTokenType(i);
      if (!ignoreBracketsInToken(tokenType)) {
        const searchStartOffset = tokens2[i * 2];
        const searchEndOffset = i < count ? tokens2[(i + 1) * 2] : newText.length;

        const currentTokenText = newText.substring(searchStartOffset, searchEndOffset);

        let result: RegExpExecArray | null;
        const isAngleBracket = (content: string) => content === "<" || content === ">";
        while ((result = this.languageConfig.regex.exec(currentTokenText)) !== null) {
          const content = result[0];
          if (isAngleBracket(content) && !this.isGenericBracket(result, startIndexToToken)) continue;

          matches.push({ content, index: result.index + searchStartOffset });
        }
      }
    }

    const newLine = new TextLine(tokenized2.ruleStack, previousLineState, index);
    for (const match of matches) {
      const lookup = this.languageConfig.bracketToId.get(match.content);
      if (lookup) {
        newLine.addBracket(match.content, match.index, lookup.key, lookup.open);
      }
    }

    const paramsTokens = this.getFunctionParametersTokens(index, newText, tokens);
    for (const token of paramsTokens) newLine.addToken(token);

    return newLine;
  }

  private isGenericBracket(result: RegExpExecArray, startIndexToToken: Map<number, IToken>): boolean {
    const content = result[0];
    const token = startIndexToToken.get(result.index);
    return Boolean(
      (content === "<" && token?.scopes.at(-1)?.startsWith("punctuation.definition.typeparameters.begin")) ||
        (content === ">" && token?.scopes.at(-1)?.startsWith("punctuation.definition.typeparameters.end"))
    );
  }

  private getFunctionParametersTokens(lineIndex: number, text: string, tokens: IToken[]): Token[] {
    const paramsTokens: Token[] = [];

    for (let token of tokens) {
      const isAVariableParameter = token.scopes.find((scope) => scope.startsWith("variable.parameter"));
      const isAFunctionParameter =
        token.scopes.find((scope) => scope.startsWith("entity.name.function")) &&
        !token.scopes.find((scope) => scope.startsWith("meta.function-call"));

      if (isAVariableParameter || isAFunctionParameter) {
        const content = text.substring(token.startIndex, token.endIndex);
        paramsTokens.push(new Token(-1, content, token.startIndex, lineIndex));
      }
    }

    return paramsTokens;
  }

  private disposeScopeDecorations() {
    this.scopeDecorations = [];
  }

  private searchScopeForwards(position: vscode.Position): BracketClose | undefined {
    for (let i = position.line; i < this.lines.length; i++) {
      const endBracket = this.lines[i].getClosingBracket(position);

      if (endBracket) {
        return endBracket;
      }
    }
  }
}
