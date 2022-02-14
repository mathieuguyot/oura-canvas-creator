/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class StringNode extends Node {
    constructor() {
        super(NodeName.String, 100, {x:0, y:0}, {
            0: {
                name: "string",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "string",
                data: { value: "" }
            }
        });
    }

    static createFromJson(json: string) : StringNode {
        let node = new StringNode();
        Node.initFromJson(json, node);
        return node;
    }

    protected computeSpecific(): { [id: string]: any } {
        return { "0": this.connectors[0].data.value };
    }
}
