/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class SplitNode extends Node {
    constructor() {
        super(NodeName.Split, 100, {x:0, y:0}, {
            0: {
                name: "out",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "none",
                data: {}
            },
            1: {
                name: "input",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "string",
                data: { value: "" }
            },
            2: {
                name: "separator",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "string",
                data: { value: "", height: "20px" }
            }
        });
    }

    static createFromJson(json: string) : SplitNode {
        let node = new SplitNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        const str = "1" in inputs ? inputs[1][0] : this.connectors[1].data.value;
        const split = "2" in inputs ? inputs[2][0] : this.connectors[2].data.value;
        return {"0": split[0] ? str.split(split[0]) : str};
    }
}
