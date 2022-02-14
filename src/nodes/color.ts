/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class ColorNode extends Node {
    constructor() {
        super(NodeName.Color, 250, {x:0, y:0}, {
            0: {
                name: "color",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "color",
                data: { color: "#fff" }
            },
            1: {
                name: "slider",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "slider",
                data: {  }
            }
        });
    }

    static createFromJson(jsonObj: any) : ColorNode {
        let node = new ColorNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(): { [id: string]: any } {
        return {};
    }
}
