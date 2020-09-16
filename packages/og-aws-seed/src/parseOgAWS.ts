import { Heading, PhrasingContent } from "mdast";
import { Processor } from "unified";

const OUTPUT: AWSService[] = [];

export function getOutput() {
  return OUTPUT;
}

type AWSService = {
  name: string;
  payload: PhrasingContent;
  entries: any[];
};

export function ogAWSPlugin() {
  // @ts-ignore
  const that: Processor = this;
  const Compiler: Processor["Compiler"] = that.Compiler;
  const visitors = Compiler.prototype.visitors;
  // const original = visitors.heading;
  const state = {
    foundStart: false,
  };
  let service: AWSService;

  visitors.heading = heading;
  function heading(node: Heading) {
    const { depth } = node;
    const value = node.children[0];
    if (value.value === "S3" && depth === 2) {
      state.foundStart = true;
    }
    if (state.foundStart) {
      if (depth === 2) {
        service = {
          name: value.value as string,
          payload: value,
          entries: [],
        };
        OUTPUT.push(service);
      } else {
        service.entries.push(node);
      }
      if (value.value === "High Availability" && depth === 2) {
        state.foundStart = false;
      }
    }
    return node;
  }
}
