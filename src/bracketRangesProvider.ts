import { TextDocument } from "vscode";
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
    let startColumn = this.getStartColumn(statement, document);
    let collapsedText = this.getCollapsedText(statement, document);

    const foldClosingBrackets = config.foldClosingBrackets();
    if (foldClosingBrackets) {
      const [bracket, bracketLine] = this.findOpeningBracket(statement, document);

      if (bracket) collapsedText = this.surroundWithBrackets(bracket, collapsedText);
      if (bracketLine !== statement.loc.start.line - 1) startColumn = undefined;
    }

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
  ): [bracket: Bracket | undefined, line: number | undefined] {
    const startLine = statement.loc.start.line - 1;
    const endLine = statement.loc.end.line - 1;
    for (let i = startLine; i <= endLine; i++) {
      const stack = [];
      const lineText = document.lineAt(i).text;
      for (const c of lineText) {
        if (c in BRACKETS) stack.push(c);
        if (Object.values(BRACKETS).includes(c)) stack.pop();
      }
      if (stack.length > 0) {
        return [stack.pop() as Bracket, i];
      }
    }

    return [undefined, undefined];
  }

  private getStartColumn(statement: ProgramStatement, document: TextDocument): number | undefined {
    const foldClosingBrackets = config.foldClosingBrackets();

    if (foldClosingBrackets) {
      const content = document.lineAt(statement.loc.start.line - 1).text;
      const bracket = Object.keys(BRACKETS).find((openingBracket) => content.includes(openingBracket));
      if (bracket) {
        return content.indexOf(bracket);
      }
    }

    return undefined;
  }

  private getCollapsedText(statement: ProgramStatement, document: TextDocument): string {
    const collapsedTextStrategy = config.collapsedTextStrategy();

    let collapsedText = "…";

    if (collapsedTextStrategy === "number of lines folded") {
      collapsedText = this.getFoldedLinesCountCollapsedText(statement, document);
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
