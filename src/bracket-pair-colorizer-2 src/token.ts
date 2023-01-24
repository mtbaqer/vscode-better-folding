import { Position, Range } from "vscode";

export default class Token {
  public readonly type: number;
  public readonly content: string;
  public range: Range;

  constructor(type: number, content: string, beginIndex: number, lineIndex: number) {
    this.type = type;
    this.content = content;
    const startPos = new Position(lineIndex, beginIndex);
    const endPos = startPos.translate(0, content.length);
    this.range = new Range(startPos, endPos);
  }

  public offset(amount: number) {
    this.range = new Range(this.range.start.translate(0, amount), this.range.end.translate(0, amount));
  }
}
