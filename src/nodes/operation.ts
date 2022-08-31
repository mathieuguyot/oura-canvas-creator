/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class OperationNode extends Node {
    constructor() {
        super(NodeName.Operation, 160, {x:0, y:0}, {
            0: {
                name: "output",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "number",
                data: { value: 0, disabled: true }
            },
            1: {
                name: "type",
                pinLayout: PinLayout.NO_PINS,
                contentType: "select",
                data: { 
                    values: ["add", "substract", "multiply", "divide", "modulo", "minimum", "maximum", "exp", "log", "log10", "negate", "sin", "cos", "tan"],
                    selected_index: 0
                }
            },
            2: {
                name: "x",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0, disabled: false }
            },
            3: {
                name: "y",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0, disabled: false }
            }
        });
    }

    static createFromJson(jsonObj: any) : OperationNode {
        let node = new OperationNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        const x = Number("2" in inputs ? inputs[2] : this.connectors[2].data.value);
        const y = Number("3" in inputs ? inputs[3] : this.connectors[3].data.value);

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
            case 5:
                value = x > y ? y : x;
                break;
            case 6:
                value = x > y ? x : y;
                break;
            case 7:
                value = Math.pow(x, y);
                break;
            case 8:
                value = Math.log(x);
                break;
            case 9:
                value = Math.log10(x);
                break;
            case 10:
                value = -x;
                break;
            case 11:
                value = Math.sin(x);
                break;
            case 12:
                value = Math.cos(x);
                break;
            case 13:
                value = Math.tan(x);
                break;
        }

        setNodes(
            nodes => produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[0].data.value = value;
                draft[nodeId].connectors[2].data.disabled = "2" in inputs;
                draft[nodeId].connectors[2].data.value = x;
                draft[nodeId].connectors[3].data.disabled = "3" in inputs;
                draft[nodeId].connectors[3].data.value = y;
            })
        );

        return { "0": value };
    }

}
