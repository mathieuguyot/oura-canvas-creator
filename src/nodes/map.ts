/* eslint-disable @typescript-eslint/no-explicit-any */
import Node, { TaskQueue } from "./node";
import { LinkCollection, NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import { Dispatch, SetStateAction } from "react";

export class MapNode extends Node {

    constructor() {
        super(NodeName.Map, 150, { x: 0, y: 0 }, {
            0: {
                name: "output",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "none",
                data: {},
            },
            1: {
                name: "input",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "none",
                data: {},
            },
            2: {
                name: "f",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "string",
                data: { value: "" },
            }
        });
    }

    static createFromJson(jsonObj: any): MapNode {
        let node = new MapNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    registerfunctionRun(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>, nodes: NodeCollection, links: LinkCollection, queue: TaskQueue): boolean {
        // 1. Fetch function node
        const functionName = "2" in inputs ? inputs[2] : this.connectors[2].data.value;
        let finNodeId: string = "";
        Object.keys(nodes).forEach(nodeKey => {
            const node = nodes[nodeKey];
            if (node.name === NodeName.FunctionInputNode && node.connectors[0].data.value === functionName) {
                finNodeId = nodeKey;
            }
        });

        if (!("1" in inputs) || finNodeId === "") {
            return false;
        }
        inputs[1].forEach((e: any, i: number) => {
            let fIns: any = {};
            fIns["3"] = e;
            fIns["4"] = i;
            queue.propateFunction(finNodeId, links, fIns);
        });

        return true;
    }

    computeSpecific(inputs: { [id: string]: any; }, nodeId: string, setNodes: Dispatch<SetStateAction<NodeCollection>>, nodes: NodeCollection, links: LinkCollection, queue: TaskQueue): { [id: string]: any; } {
        // 1. Fetch function node
        const functionName = "2" in inputs ? inputs[2] : this.connectors[2].data.value;
        let finNodeId: string = "";
        Object.keys(nodes).forEach(nodeKey => {
            const node = nodes[nodeKey];
            if (node.name === NodeName.FunctionInputNode && node.connectors[0].data.value === functionName) {
                finNodeId = nodeKey;
            }
        });

        if (!("1" in inputs) || finNodeId === "") {
            return { "0": [] };
        }
        const res = [] as any[];
        inputs[1].forEach((e: any, i: number) => {
            res.push(queue.popResult());

        });
        return { "0": res };
    }
}