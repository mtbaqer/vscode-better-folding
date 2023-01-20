import { Range } from "vscode";
import Bracket from "../../bracket-pair-colorizer-2 src/bracket";

export default class BracketsRange extends Range {
  constructor(public startBracket: Bracket, public endBracket: Bracket) {
    super(startBracket.token.range.start, endBracket.token.range.end);
  }
}
