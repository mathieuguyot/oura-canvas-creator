/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export class ObjectCreatorNode extends Node {
    public nodeId?: string;
    public setNodes?: React.Dispatch<React.SetStateAction<NodeCollection>>;
    constructor() {
        super(
            NodeName.ObjectCreatorNode,
            150,
            { x: 0, y: 0 },
            {
                0: {
                    name: "object",
                    pinLayout: PinLayout.RIGHT_PIN,
                    contentType: "none",
                    data: {}
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
                }
            }
        );
        this.add = this.add.bind(this);
        this.remove = this.remove.bind(this);
        this.connectors[1].data.onClick = this.add;
        this.connectors[2].data.onClick = this.remove;
    }

    add(node: Node) {
        if (this.nodeId && this.setNodes) {
            this.setNodes((nodes) =>
                produce(nodes, (draft: NodeCollection) => {
                    if (this.nodeId) {
                        draft[this.nodeId].connectors[Object.keys(node.connectors).length] = {
                            name: `param-${Object.keys(node.connectors).length - 2}`,
                            pinLayout: PinLayout.LEFT_PIN,
                            contentType: "string",
                            data: {
                                value: ""
                            }
                        };
                    }
                })
            );
        }
    }

    remove(node: Node) {
        if (Object.keys(node.connectors).length > 2) {
        }
    }

    static createFromJson(
        jsonObj: any,
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): ObjectCreatorNode {
        let node = new ObjectCreatorNode();
        Node.initFromJson(jsonObj, node);
        node.nodeId = nodeId;
        node.setNodes = setNodes;
        node.connectors[1].data.onClick = node.add.bind(node);
        node.connectors[2].data.onClick = node.remove.bind(node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        const obj: any = {};
        Object.keys(this.connectors).forEach((key: string, index: number) => {
            if (index <= 2) return;
            const val = key in inputs ? inputs[key] : undefined;
            obj[this.connectors[key].data.value] = val;
        });
        return { "0": obj };
    }
}

export class ObjectExtractorNode extends Node {
    public nodeId?: string;
    public setNodes?: React.Dispatch<React.SetStateAction<NodeCollection>>;
    constructor() {
        super(
            NodeName.ObjectExtractorNode,
            150,
            { x: 0, y: 0 },
            {
                0: {
                    name: "object",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "none",
                    data: {}
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
                }
            }
        );
        this.add = this.add.bind(this);
        this.remove = this.remove.bind(this);
        this.connectors[1].data.onClick = this.add;
        this.connectors[2].data.onClick = this.remove;
    }

    add(node: Node) {
        if (this.nodeId && this.setNodes) {
            this.setNodes((nodes) =>
                produce(nodes, (draft: NodeCollection) => {
                    if (this.nodeId) {
                        draft[this.nodeId].connectors[Object.keys(node.connectors).length] = {
                            name: `param-${Object.keys(node.connectors).length - 2}`,
                            pinLayout: PinLayout.RIGHT_PIN,
                            contentType: "string",
                            data: {
                                value: ""
                            }
                        };
                    }
                })
            );
        }
    }

    remove(node: Node) {
        if (Object.keys(node.connectors).length > 2) {
        }
    }

    static createFromJson(
        jsonObj: any,
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): ObjectExtractorNode {
        let node = new ObjectExtractorNode();
        Node.initFromJson(jsonObj, node);
        node.nodeId = nodeId;
        node.setNodes = setNodes;
        node.connectors[1].data.onClick = node.add.bind(node);
        node.connectors[2].data.onClick = node.remove.bind(node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        const ret: any = {};
        Object.keys(this.connectors).forEach((key: string, index: number) => {
            if (index <= 2) return;
            const paramName = this.connectors[key].data.value;
            const val =
                "0" in inputs && paramName in inputs["0"] ? inputs["0"][paramName] : undefined;
            ret[key] = val;
        });
        return ret;
    }
}
