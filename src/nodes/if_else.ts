/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class IfElseNode extends Node {
    constructor() {
        super(
            NodeName.IfElse,
            100,
            { x: 0, y: 0 },
            {
                0: {
                    name: "out_value",
                    pinLayout: PinLayout.RIGHT_PIN,
                    contentType: "none",
                    data: {}
                },
                1: {
                    name: "test",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "check_box",
                    data: { value: false }
                },
                2: {
                    name: "if_value",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "none",
                    data: {}
                },
                3: {
                    name: "else_value",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "none",
                    data: {}
                }
            }
        );
    }

    static createFromJson(json: string): IfElseNode {
        let node = new IfElseNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): { [id: string]: any } {
        const cond = "1" in inputs ? inputs[1] : this.connectors[1].data.value;
        const if_value = "2" in inputs ? inputs[2] : null;
        const else_value = "3" in inputs ? inputs[3] : null;
        let ret = { "0": else_value };
        if (cond) {
            ret = { "0": if_value };
        }

        setNodes((nodes) =>
            produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[1].data.disabled = "1" in inputs;
                draft[nodeId].connectors[1].data.value = cond;
            })
        );

        return ret;
    }
}
