/* eslint-disable @typescript-eslint/no-explicit-any */
import Node, { propateFunction } from "./node";
import { LinkCollection, NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";
import { Dispatch, SetStateAction } from "react";

export class MapNode extends Node {
    
    constructor() {
        super(NodeName.Map, 150, {x:0, y:0}, {
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
                pinLayout: PinLayout.NO_PINS, 
                contentType: "string", 
                data: { value: "" },
            }
        });
    }
    
    static createFromJson(jsonObj: any) : MapNode {
        let node = new MapNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any; }, nodeId: string, setNodes: Dispatch<SetStateAction<NodeCollection>>, nodes: NodeCollection, links: LinkCollection): { [id: string]: any; } {
        // 1. Fetch function node
        const functionName = this.connectors[2].data.value;
        const expectedConnectors: string[] = [];
        let finNodeId: string = "";
        Object.keys(nodes).forEach(nodeKey => {
            const node = nodes[nodeKey];
            if(node.name === NodeName.FunctionInputNode && node.connectors[0].data.value === functionName) {
                finNodeId = nodeKey;
            }
        });

        if(!("1" in inputs) || finNodeId === "") {
            return {"0": []};
        }
        const res = [] as any[];
        inputs[1].forEach((e: any) => {
            let fIns: any = {};
            fIns["3"] = e;
            res.push(propateFunction(finNodeId, nodes, links, setNodes, fIns));
            
        });
        return {"0": res};
    }
}