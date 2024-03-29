/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class SplitNode extends Node {
    constructor() {
        super(
            NodeName.Split,
            "string",
            100,
            { x: 0, y: 0 },
            {
                0: {
                    name: "out",
                    pinLayout: PinLayout.RIGHT_PIN,
                    contentType: "none",
                    data: {}
                },
                1: {
                    name: "input",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "text_area",
                    data: { value: "" }
                },
                2: {
                    name: "separator",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "string",
                    data: { value: "", height: "20px" }
                }
            }
        );
    }

    static createFromJson(json: string): SplitNode {
        let node = new SplitNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        let str: string = "1" in inputs ? inputs[1] : this.connectors[1].data.value;
        let split: string = "2" in inputs ? inputs[2] : this.connectors[2].data.value;
        str = !str ? "" : str;
        split = !split ? "" : split;
        return { "0": str.split(new RegExp(split)) };
    }
}
