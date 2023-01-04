/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class RangeNode extends Node {
    constructor() {
        super(
            NodeName.Range,
            "array",
            170,
            { x: 0, y: 0 },
            {
                0: {
                    name: "count",
                    pinLayout: PinLayout.BOTH_PINS,
                    contentType: "number",
                    data: { value: 0 }
                }
            }
        );
    }

    static createFromJson(json: string): RangeNode {
        let node = new RangeNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): { [id: string]: any } {
        const count = Number("0" in inputs ? inputs[0] : this.connectors[0].data.value);
        const array = [];
        let cur = 0;
        while (cur < count) {
            array.push(cur);
            cur++;
        }

        setNodes((nodes) =>
            produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[0].data.disabled = "0" in inputs;
            })
        );

        return { "0": array };
    }
}
