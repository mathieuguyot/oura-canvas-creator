/* eslint-disable @typescript-eslint/no-explicit-any */
import Node, { TaskQueue } from "./node";
import { LinkCollection, NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";
import { Dispatch, SetStateAction } from "react";

export class FunctionCallNode extends Node {
    constructor() {
        super(
            NodeName.FunctionCallNode,
            150,
            { x: 0, y: 0 },
            {
                0: {
                    name: "function_name",
                    pinLayout: PinLayout.NO_PINS,
                    contentType: "string",
                    data: { value: "" }
                },
                1: {
                    name: "output",
                    pinLayout: PinLayout.RIGHT_PIN,
                    contentType: "none",
                    data: {}
                }
            }
        );
    }

    static createFromJson(jsonObj: any): FunctionCallNode {
        let node = new FunctionCallNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    registerfunctionRun(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>,
        nodes: NodeCollection,
        links: LinkCollection,
        queue: TaskQueue
    ): boolean {
        // 1. Fetch function node
        const functionName = this.connectors[0].data.value;
        const expectedConnectors: string[] = [];
        let finNodeId: string = "";
        Object.keys(nodes).forEach((nodeKey) => {
            const node = nodes[nodeKey];
            if (
                node.name === NodeName.FunctionInputNode &&
                node.connectors[0].data.value === functionName
            ) {
                finNodeId = nodeKey;
                Object.keys(node.connectors).forEach((key) => {
                    if (Number(key) > 2 && node) {
                        expectedConnectors.push(node.connectors[key].name);
                    }
                });
            }
        });

        setNodes((nodes) =>
            produce(nodes, (draft: NodeCollection) => {
                if (nodeId) {
                    Object.keys(draft[nodeId].connectors).forEach((key) => {
                        if (Number(key) > 1) {
                            delete draft[nodeId].connectors[key];
                        }
                    });
                    expectedConnectors.forEach((value, i) => {
                        draft[nodeId].connectors[i + 2] = {
                            name: value,
                            pinLayout: PinLayout.LEFT_PIN,
                            contentType: "none",
                            data: {}
                        };
                    });
                }
            })
        );

        let fIns: any = {};
        expectedConnectors.forEach((_, i) => {
            if (i + 2 in inputs) {
                fIns[`${i + 3}`] = inputs[`${i + 2}`];
            }
        });

        if (finNodeId.length > 0) {
            queue.propateFunction(finNodeId, links, fIns);
            return true;
        }
        return false;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: Dispatch<SetStateAction<NodeCollection>>,
        nodes: NodeCollection,
        links: LinkCollection,
        queue: TaskQueue
    ): { [id: string]: any } {
        // 1. Fetch function node
        const functionName = this.connectors[0].data.value;
        const expectedConnectors: string[] = [];
        let finNodeId: string = "";
        Object.keys(nodes).forEach((nodeKey) => {
            const node = nodes[nodeKey];
            if (
                node.name === NodeName.FunctionInputNode &&
                node.connectors[0].data.value === functionName
            ) {
                finNodeId = nodeKey;
                Object.keys(node.connectors).forEach((key) => {
                    if (Number(key) > 2 && node) {
                        expectedConnectors.push(node.connectors[key].name);
                    }
                });
            }
        });

        let fIns: any = {};
        expectedConnectors.forEach((_, i) => {
            if (i + 2 in inputs) {
                fIns[`${i + 3}`] = inputs[`${i + 2}`];
            }
        });

        if (finNodeId.length > 0) {
            return { "1": queue.popResult() };
        }

        return {};
    }
}

export class FunctionInputNode extends Node {
    public nodeId?: string;
    public setNodes?: React.Dispatch<React.SetStateAction<NodeCollection>>;
    constructor() {
        super(
            NodeName.FunctionInputNode,
            150,
            { x: 0, y: 0 },
            {
                0: {
                    name: "name",
                    pinLayout: PinLayout.RIGHT_PIN,
                    contentType: "string",
                    data: { value: "" }
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
                                value: `param-${Object.keys(node.connectors).length - 2}`
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
    ): FunctionInputNode {
        let node = new FunctionInputNode();
        Node.initFromJson(jsonObj, node);
        node.nodeId = nodeId;
        node.setNodes = setNodes;
        node.connectors[1].data.onClick = node.add.bind(node);
        node.connectors[2].data.onClick = node.remove.bind(node);
        return node;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): { [id: string]: any } {
        return inputs;
    }
}

export class FunctionOutputNode extends Node {
    constructor() {
        super(
            NodeName.FunctionOutputNode,
            150,
            { x: 0, y: 0 },
            {
                0: {
                    name: "function",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "none",
                    data: {},
                    rightPinColor: "orange"
                },
                1: {
                    name: "return",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "none",
                    data: {},
                    rightPinColor: "orange"
                }
            }
        );
    }

    static createFromJson(jsonObj: any): FunctionOutputNode {
        let node = new FunctionOutputNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): { [id: string]: any } {
        return {};
    }
}

export class LambdaCallNode extends Node {
    public nodeId?: string;
    public setNodes?: React.Dispatch<React.SetStateAction<NodeCollection>>;
    constructor() {
        super(
            NodeName.LambdaCall,
            150,
            { x: 0, y: 0 },
            {
                0: {
                    name: "name",
                    pinLayout: PinLayout.BOTH_PINS,
                    contentType: "string",
                    data: { value: "" }
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
                            contentType: "none",
                            data: {
                                value: `param-${Object.keys(node.connectors).length - 2}`
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
    ): LambdaCallNode {
        let node = new LambdaCallNode();
        Node.initFromJson(jsonObj, node);
        node.nodeId = nodeId;
        node.setNodes = setNodes;
        node.connectors[1].data.onClick = node.add.bind(node);
        node.connectors[2].data.onClick = node.remove.bind(node);
        return node;
    }

    registerfunctionRun(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>,
        nodes: NodeCollection,
        links: LinkCollection,
        queue: TaskQueue
    ): boolean {
        // 1. Fetch function node
        const functionName = "0" in inputs ? inputs[0] : this.connectors[0].data.value;
        let finNodeId: string = "";
        Object.keys(nodes).forEach((nodeKey) => {
            const node = nodes[nodeKey];
            if (
                node.name === NodeName.FunctionInputNode &&
                node.connectors[0].data.value === functionName
            ) {
                finNodeId = nodeKey;
            }
        });

        let fIns: any = {};
        Object.keys(this.connectors).forEach((key: string, index: number) => {
            if (index <= 2) return;
            const val = key in inputs ? inputs[key] : undefined;
            fIns[key] = val;
        });

        if (finNodeId.length > 0) {
            queue.propateFunction(finNodeId, links, fIns);
            return true;
        }
        return false;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: Dispatch<SetStateAction<NodeCollection>>,
        nodes: NodeCollection,
        links: LinkCollection,
        queue: TaskQueue
    ): { [id: string]: any } {
        let finNodeId: string = "";
        const functionName = "0" in inputs ? inputs[0] : this.connectors[0].data.value;
        Object.keys(nodes).forEach((nodeKey) => {
            const node = nodes[nodeKey];
            if (
                node.name === NodeName.FunctionInputNode &&
                node.connectors[0].data.value === functionName
            ) {
                finNodeId = nodeKey;
            }
        });

        if (finNodeId.length > 0) {
            return { "0": queue.popResult() };
        }

        return {};
    }
}
