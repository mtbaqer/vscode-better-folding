import { TextDocument, FoldingContext, CancellationToken, Range } from "vscode";
import { BetterFoldingRange, BetterFoldingRangeProvider } from "./types";
import { parse } from "@typescript-eslint/typescript-estree";
import { JSXElement, BaseNode } from "@typescript-eslint/types/dist/generated/ast-spec";

export default class JsxRangesProvider implements BetterFoldingRangeProvider {
  public provideFoldingRanges(
    document: TextDocument,
    context?: FoldingContext | undefined,
    token?: CancellationToken | undefined,
    useCachedRanges?: boolean | undefined
  ): Promise<BetterFoldingRange[]> {
    const jsxElements: JSXElement[] = [];
    const ast = parse(document.getText(), { jsx: true, loc: true, range: true });
    this.visit(ast, jsxElements);

    const foldingRanges = this.jsxElementsToFoldingRanges(jsxElements, document);

    return Promise.resolve(foldingRanges);
  }

  private visit(node: unknown, jsxElements: JSXElement[]) {
    if (Array.isArray(node)) {
      for (const child of node) this.visit(child, jsxElements);
      return;
    }
    if (!this.isBaseNode(node)) return;

    if (node.loc.end.line - node.loc.start.line > 0) {
      for (const child of Object.values(node)) {
        this.visit(child, jsxElements);
      }
      if (this.isJsxElement(node)) {
        jsxElements.push(node);
      }
    }
  }

  private isBaseNode(node: unknown): node is BaseNode {
    return Boolean(node) && node!.hasOwnProperty("type");
  }

  private isJsxElement(node: BaseNode): node is JSXElement {
    return node.type === "JSXElement";
  }

  private jsxElementsToFoldingRanges(jsxElements: JSXElement[], document: TextDocument): BetterFoldingRange[] {
    const foldingRanges: BetterFoldingRange[] = [];

    for (const jsxElement of jsxElements) {
      const start = jsxElement.loc.start.line - 1;
      const end = jsxElement.loc.end.line - 1;

      const startColumn = this.getStartColumn(jsxElement);
      const collapsedText = this.getCollapsedText(jsxElement, document);

      foldingRanges.push({ start, end, startColumn, collapsedText });
    }

    return foldingRanges;
  }

  private getStartColumn(jsxElement: JSXElement): number | undefined {
    return jsxElement.openingElement.name.loc.end.column;
  }

  private getCollapsedText(jsxElement: JSXElement, document: TextDocument): string {
    if (!jsxElement.closingElement) {
      return "…/>";
    }

    const closingElementRange = new Range(
      jsxElement.closingElement.loc.start.line - 1,
      jsxElement.closingElement.loc.start.column,
      jsxElement.closingElement.loc.end.line - 1,
      jsxElement.closingElement.loc.end.column
    );

    const closingElementText = document.getText(closingElementRange);
    return `>…${closingElementText}`;
  }
}
