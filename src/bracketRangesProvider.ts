import { Position, TextDocument } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import * as config from "./configuration";
import * as parser from "@typescript-eslint/typescript-estree";
import { ProgramStatement } from "@typescript-eslint/types/dist/generated/ast-spec";

const BRACKETS = {
  "{": "}",
  "[": "]",
  "(": ")",
  "<": ">",
  "`": "`",
};

export class BracketRangesProvider implements BetterFoldingRangeProvider {
  public provideFoldingRanges(document: TextDocument): BetterFoldingRange[] {
    const ranges: BetterFoldingRange[] = [];

    const asTree = parser.parse(document.getText(), { loc: true });
    const { body } = asTree;

    for (const statement of body) {
      if (statement.loc.end.line - statement.loc.start.line > 0) {
        ranges.push({
          start: statement.loc.start.line - 1,
          end: statement.loc.end.line - 1,
          startColumn: this.getStartColumn(statement, document),
          collapsedText: this.getCollapsedText(statement, document),
        });
      }
    }

    return ranges;
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
    const foldClosingBrackets = config.foldClosingBrackets();
    const collapsedTextStrategy = config.collapsedTextStrategy();

    let collapsedText = "…";

    if (collapsedTextStrategy === "number of lines folded") {
      collapsedText = this.getFoldedLinesCountCollapsedText(statement, document);
    }

    if (foldClosingBrackets) {
      collapsedText = this.surroundWithBrackets(collapsedText, statement, document);
    }

    return collapsedText;
  }

  private surroundWithBrackets(collapsedText: string, statement: ProgramStatement, document: TextDocument): string {
    const content = document.lineAt(statement.loc.start.line - 1).text;
    let bracket: keyof typeof BRACKETS | undefined = undefined;
    for (const openingBracket of Object.keys(BRACKETS)) {
      if (content.includes(openingBracket)) {
        bracket = openingBracket as keyof typeof BRACKETS;
        break;
      }
    }

    if (bracket) {
      return `${bracket}${collapsedText}${BRACKETS[bracket]}`;
    }
    return collapsedText;
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
