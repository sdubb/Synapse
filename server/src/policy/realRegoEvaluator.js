import { regoPolicyInterpreter } from "./regoPolicyInterpreter.js";

export class RealRegoEvaluator {
  constructor() {
    this.interpreter = regoPolicyInterpreter;
    this.regoSourcePath = this.interpreter.policyPath;
    this.regoSource = this.interpreter.regoSource;
  }

  evaluate(input) {
    return this.interpreter.evaluate(input);
  }
}

export const realRegoEvaluator = new RealRegoEvaluator();
