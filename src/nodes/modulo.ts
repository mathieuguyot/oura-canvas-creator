/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class ModuloNode extends Node {
    constructor() {
        super(NodeName.Modulo, 100, {x:0, y:0}, {
            0: {
                name: "output",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "none",
                data: { value: 0 }
            },
            1: {
                name: "input",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0 }
            },
            2: {
                name: "modulo",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 1 }
            },
        });
    }

    static createFromJson(jsonObj: any) : ModuloNode {
        let node = new ModuloNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        const x = "1" in inputs ? inputs[1][0] : this.connectors[1].data.value;
        const y = "2" in inputs ? inputs[2][0] : this.connectors[2].data.value;
        const modulo = isNaN(x % y) ? 0 : x % y;
        return { "0": modulo };
    }

}
