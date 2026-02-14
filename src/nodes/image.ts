/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout, NodeCollection } from "oura-node-editor";
import { NodeName } from "./consts";
import { produce } from "immer";

export default class ImageNode extends Node {
    constructor() {
        super(
            NodeName.Image,
            "general",
            150,
            { x: 0, y: 0 },
            {
                0: {
                    name: "count",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "image",
                    data: { src: "" }
                }
            }
        );
    }

    static createFromJson(jsonObj: any): ImageNode {
        let node = new ImageNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): { [id: string]: any } {
        const src = "0" in inputs ? inputs[0] : "";
        setNodes((nodes: any) =>
            produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[0].data.src = src;
            })
        );
        return {};
    }
}
