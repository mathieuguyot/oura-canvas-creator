/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";
import _ from "lodash";

export default class LogNode extends Node {
    public inputs: any;
    
    constructor() {
        super(NodeName.Log, 100, {x:0, y:0}, {
            0: {
                name: "log",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "none",
                data: {}
            },
            1: {
                name: "log",
                pinLayout: PinLayout.NO_PINS,
                contentType: "button",
                data: { 
                    label: "log"
                }
            },
        });
        this.inputs = [];
        this.connectors[1].data.onClick = this.log
    }

    log(node: Node) {
        (node as LogNode).inputs.forEach((element: any) => {
            console.log(element);
        });
    }

    static createFromJson(json: string) : LogNode {
        let node = new LogNode();
        Node.initFromJson(json, node);
        node.connectors[1].data.onClick = node.log;
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        if(inputs[0] && !_.isEqual(inputs[0], this.inputs)) {
            setNodes(
                nodes => produce(nodes, (draft: NodeCollection) => {
                    (draft[nodeId] as LogNode).inputs = inputs[0];
                })
            );
        }
        return {};
    }
}
