/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class LengthNode extends Node {
    constructor() {
        super(NodeName.Length, 170, {x:0, y:0}, {
            0: {
                name: "size",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "number",
                data: { value: "0", disabled: true }
            },
            1: {
                name: "array",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "none",
                data: { }
            }
        });
    }

    static createFromJson(json: string) : LengthNode {
        let node = new LengthNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        const array = "1" in inputs ? inputs[1] : [];
        const length = array ? array.length : 0;
        setNodes(
            nodes => produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[0].data.disabled = true;
                draft[nodeId].connectors[0].data.value = length;
            })
        );
        return { "0": length };
    }
}
