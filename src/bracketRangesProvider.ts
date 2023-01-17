import { Position, TextDocument } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import * as config from "./configuration";
import * as parser from "@typescript-eslint/typescript-estree";
import { ProgramStatement } from "@typescript-eslint/types/dist/generated/ast-spec";
import { isStatement } from "./utils";

const BRACKETS = {
  "{": "}",
  "[": "]",
  "(": ")",
  "<": ">",
  "`": "`",
};
type Bracket = keyof typeof BRACKETS;

export class BracketRangesProvider implements BetterFoldingRangeProvider {
  public provideFoldingRanges(document: TextDocument): BetterFoldingRange[] {
    const asTree = parser.parse(document.getText(), { loc: true, range: true });

    const allFoldingRanges: BetterFoldingRange[] = [];
    for (const node of asTree.body) {
      const foldingRanges: BetterFoldingRange[] = [];
      this.getFoldingRangesFromTreeNode(foldingRanges, node, document);
      allFoldingRanges.push(...foldingRanges);
    }
    return allFoldingRanges;
  }

  private getFoldingRangesFromTreeNode(foldingRanges: BetterFoldingRange[], node: unknown, document: TextDocument) {
    if (Array.isArray(node)) {
      for (const child of node) this.getFoldingRangesFromTreeNode(foldingRanges, child, document);
      return;
    }
    if (!isStatement(node)) return;

    if (node.loc.end.line - node.loc.start.line > 0) {
      const range = this.toFoldingRange(node, document);
      foldingRanges.push(range);

      for (const child of Object.values(node)) {
        this.getFoldingRangesFromTreeNode(foldingRanges, child, document);
      }
    }
  }

  private toFoldingRange(statement: ProgramStatement, document: TextDocument): BetterFoldingRange {
    let bracket: Bracket | undefined = undefined;
    let bracketPosition: Position | undefined = undefined;

    const foldClosingBrackets = config.foldClosingBrackets();
    if (foldClosingBrackets) {
      [bracket, bracketPosition] = this.findOpeningBracket(statement, document);
    }

    const startColumn = this.getStartColumn(statement, bracketPosition);
    const collapsedText = this.getCollapsedText(statement, document, bracket);

    return {
      start: statement.loc.start.line - 1,
      end: statement.loc.end.line - 1,
      startColumn,
      collapsedText,
    };
  }

  //Find the first opening bracket in statement that does not have a closing bracket in the same line.
  //If many found in the same line, take the last one.
  private findOpeningBracket(
    statement: ProgramStatement,
    document: TextDocument
  ): [bracket: Bracket | undefined, position: Position | undefined] {
    const startLine = statement.loc.start.line - 1;
    const endLine = statement.loc.end.line - 1;
    for (let line = startLine; line <= endLine; line++) {
      const stack: [string, number][] = [];
      const lineText = document.lineAt(line).text;
      for (let column = 0; column < lineText.length; column++) {
        const character = lineText[column];
        if (character in BRACKETS) stack.push([character, column]);
        if (Object.values(BRACKETS).includes(character)) stack.pop();
      }
      if (stack.length > 0) {
        const [bracket, column] = stack.pop()!;
        return [bracket as Bracket, new Position(line, column)];
      }
    }

    return [undefined, undefined];
  }

  private getStartColumn(statement: ProgramStatement, bracketPosition: Position | undefined): number | undefined {
    if (!bracketPosition || bracketPosition.line !== statement.loc.start.line - 1) return undefined;
    return bracketPosition.character;
  }

  private getCollapsedText(statement: ProgramStatement, document: TextDocument, bracket: Bracket | undefined): string {
    const collapsedTextStrategy = config.collapsedTextStrategy();

    let collapsedText = "…";

    if (collapsedTextStrategy === "number of lines folded") {
      collapsedText = this.getFoldedLinesCountCollapsedText(statement, document);
    }

    if (bracket) {
      collapsedText = this.surroundWithBrackets(bracket, collapsedText);
    }

    return collapsedText;
  }

  private surroundWithBrackets(bracket: Bracket, collapsedText: string): string {
    return `${bracket}${collapsedText}${BRACKETS[bracket]}`;
  }

  private getFoldedLinesCountCollapsedText(statement: ProgramStatement, document: TextDocument) {
    let closingBracketInNewLine = false;
    const lastLineContent = document.lineAt(statement.loc.end.line - 1).text;
    for (const closingBracket in Object.values(BRACKETS)) {
      if (lastLineContent[0] === closingBracket) {
        closingBracketInNewLine = true;
        break;
      }
    }
    const linesCount = statement.loc.end.line - statement.loc.start.line - (closingBracketInNewLine ? 1 : 0);
    return ` ⋯ ${linesCount} lines ⋯ `;
  }
}
