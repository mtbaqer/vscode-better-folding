import Bracket from "./bracket";
import Token from "./token";

export default class BracketClose extends Bracket {
  public readonly openBracket: Bracket;
  constructor(token: Token, openBracket: Bracket) {
    super(token);
    this.openBracket = openBracket;
  }
}
