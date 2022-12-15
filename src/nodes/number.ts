/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class NumberNode extends Node {
    constructor() {
        super(
            NodeName.Number,
            170,
            { x: 0, y: 0 },
            {
                0: {
                    name: "number",
                    pinLayout: PinLayout.RIGHT_PIN,
                    contentType: "number",
                    data: { value: 0 }
                }
            }
        );
    }

    static createFromJson(json: string): NumberNode {
        let node = new NumberNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(): { [id: string]: any } {
        return { "0": Number(this.connectors[0].data.value) };
    }
}
