import { Range } from "vscode";
import Bracket from "../../BracketManager/bracket";

export default class BracketsRange extends Range {
  constructor(public startBracket: Bracket, public endBracket: Bracket) {
    super(startBracket.token.range.start, endBracket.token.range.end);
  }
}
