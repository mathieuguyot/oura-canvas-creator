/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class OperationNode extends Node {
    constructor() {
        super(NodeName.Operation, 100, {x:0, y:0}, {
            0: {
                name: "output",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "none",
                data: { value: 0 }
            },
            1: {
                name: "type",
                pinLayout: PinLayout.NO_PINS,
                contentType: "select",
                data: { 
                    values: ["add", "substract", "multiply", "divide", "modulo"],
                    selected_index: 0
                }
            },
            2: {
                name: "x",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0 }
            },
            3: {
                name: "y",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0 }
            }
        });
    }

    static createFromJson(jsonObj: any) : OperationNode {
        let node = new OperationNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        const x = Number("2" in inputs ? inputs[2][0] : this.connectors[2].data.value);
        const y = Number("3" in inputs ? inputs[3][0] : this.connectors[3].data.value);
        let value = 0;
        switch(this.connectors[1].data.selected_index) {
            case 0:
                value = x + y;
                break;
            case 1:
                value = x - y;
                break;
            case 2:
                value = x * y;
                break;
            case 3:
                value = isNaN(x / y) ? 0 : x / y;
                break;
            case 4:
                value = isNaN(x % y) ? 0 : x % y;
                break;
        }
        return { "0": value };
    }

}
