/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class ThreeJS extends Node {
    constructor() {
        super(NodeName.ThreeJS, 170, { x: 0, y: 0 }, {
            0: {
                name: "threejs",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "threejs",
                data: {}
            }
        });
    }

    static createFromJson(json: string): ThreeJS {
        let node = new ThreeJS();
        Node.initFromJson(json, node);
        node.connectors[0].data = {};
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        setNodes(
            nodes => produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[0].data.obj = inputs[0] ? inputs[0] : undefined;
            })
        );
        return {};
    }
}
