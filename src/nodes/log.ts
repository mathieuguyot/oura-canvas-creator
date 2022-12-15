/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class LogNode extends Node {
    public inputs: any;

    constructor() {
        super(
            NodeName.Log,
            100,
            { x: 0, y: 0 },
            {
                0: {
                    name: "log",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "text_area",
                    data: { value: "", disabled: true },
                    leftPinColor: "red"
                }
            }
        );
    }

    static createFromJson(json: string): LogNode {
        let node = new LogNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): { [id: string]: any } {
        setNodes((nodes) =>
            produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[0].data.value =
                    "0" in inputs ? JSON.stringify(inputs[0]) : "";
            })
        );
        return {};
    }
}
