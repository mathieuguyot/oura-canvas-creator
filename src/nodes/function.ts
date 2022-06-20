/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export class FunctionInputNode extends Node {
    protected nodeId ?: string;
    protected setNodes ?: React.Dispatch<React.SetStateAction<NodeCollection>>;
    constructor() {
        super(NodeName.FunctionInputNode, 150, {x:0, y:0}, {
            0: { 
                name: "func-out", 
                pinLayout: PinLayout.RIGHT_PIN, 
                contentType: "none", 
                data: { },
                rightPinColor: "orange"
            },
            1: {
                name: "add",
                pinLayout: PinLayout.NO_PINS,
                contentType: "button",
                data: { 
                    label: "add input"
                }
            },
            2: {
                name: "remove",
                pinLayout: PinLayout.NO_PINS,
                contentType: "button",
                data: { 
                    label: "remove input"
                }
            },
        });
        this.add = this.add.bind(this);
        this.remove = this.remove.bind(this);
        this.connectors[1].data.onClick = this.add
        this.connectors[2].data.onClick = this.remove
    }

    add(node: Node) {
        if(this.nodeId && this.setNodes) {
            this.setNodes(
                nodes => produce(nodes, (draft: NodeCollection) => {
                    if(this.nodeId) {
                        draft[this.nodeId].connectors[Object.keys(node.connectors).length] = {
                            name: `param-${Object.keys(node.connectors).length-2}`,
                            pinLayout: PinLayout.NO_PINS,
                            contentType: "string",
                            data: { 
                                value: `param-${Object.keys(node.connectors).length-2}`
                            }
                        }
                    }
                })
            );
        }
    }

    remove(node: Node) {
        if(Object.keys(node.connectors).length > 2) {

        }
    }

    static createFromJson(jsonObj: any) : FunctionInputNode {
        let node = new FunctionInputNode();
        Node.initFromJson(jsonObj, node);
        node.connectors[1].data.onClick = node.add.bind(node);
        node.connectors[2].data.onClick = node.remove.bind(node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        this.nodeId = nodeId;
        this.setNodes = setNodes;
        return {  };
    }
}

export class FunctionOutputNode extends Node {
    constructor() {
        super(NodeName.FunctionOutputNode, 150, {x:0, y:0}, {
            0: { 
                name: "func-in", 
                pinLayout: PinLayout.LEFT_PIN, 
                contentType: "none", 
                data: { },
                rightPinColor: "orange"
            }
        });
    }

    static createFromJson(jsonObj: any) : FunctionInputNode {
        let node = new FunctionInputNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        return {  };
    }
}