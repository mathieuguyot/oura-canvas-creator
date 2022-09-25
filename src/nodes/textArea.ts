/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class TextAreaNode extends Node {
    constructor() {
        super(NodeName.TextArea, 100, {x:0, y:0}, {
            0: {
                name: "string",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "text_area",
                data: { value: "" }
            }
        });
    }

    static createFromJson(json: string) : TextAreaNode {
        let node = new TextAreaNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(): { [id: string]: any } {
        return { "0": this.connectors[0].data.value };
    }
}
