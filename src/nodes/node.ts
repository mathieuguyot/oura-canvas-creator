/* eslint-disable @typescript-eslint/no-explicit-any */
import { immerable } from "immer";
import {
    ConnectorCollection,
    LinkCollection,
    NodeCollection,
    NodeModel,
    XYPosition
} from "oura-node-editor";
import { NodeName } from "./consts";

function getOutputLinks(nodeId: string, links: LinkCollection): LinkCollection {
    const linkOutputs: LinkCollection = {};
    Object.keys(links).forEach((linkKey) => {
        const link = links[linkKey];
        if (link.rightNodeId === nodeId) {
            linkOutputs[linkKey] = links[linkKey];
        }
    });
    return linkOutputs;
}

function getInputsLinks(nodeId: string, links: LinkCollection): LinkCollection {
    const linkOutputs: LinkCollection = {};
    Object.keys(links).forEach((linkKey) => {
        const link = links[linkKey];
        if (link.leftNodeId === nodeId) {
            linkOutputs[linkKey] = links[linkKey];
        }
    });
    return linkOutputs;
}

function propagationDictToOrderedList(propagationDict: { [id: string]: number }): string[] {
    const propagationList: [string, number][] = [];
    Object.keys(propagationDict).forEach((nodeId) =>
        propagationList.push([nodeId, propagationDict[nodeId]])
    );
    propagationList.sort((a, b) => a[1] - b[1]);
    return propagationList.map(([nodeId, _]) => nodeId);
}

function createPropagationTree(
    nodeId: string,
    links: LinkCollection,
    depth: number,
    propagationDict: { [id: string]: number }
): void {
    propagationDict[nodeId] =
        nodeId in propagationDict ? Math.max(depth, propagationDict[nodeId]) : depth;
    const outputLinks = getOutputLinks(nodeId, links);
    Object.keys(outputLinks).forEach((linkKey) => {
        createPropagationTree(links[linkKey].leftNodeId, links, depth + 1, propagationDict);
    });
}

type FunctionCall = {
    functionOutId: string;
    propagationValues: { [id: string]: any };
    inputs: { [id: string]: any };
    alreadyComputedNodes: string[];
    toBeComputed: [string, boolean][];
};

export class TaskQueue {
    protected tasks: [string, boolean][] = [];
    protected propagationValues: { [id: string]: any } = {};
    protected functionCalls: FunctionCall[] = [];
    protected functionResults: any[] = [];

    reset() {
        this.tasks = [];
        this.propagationValues = {};
        this.functionCalls = [];
        this.functionResults = [];
    }

    popResult(): any {
        return this.functionResults.pop();
    }

    propateFunction(nodeId: string, links: LinkCollection, fIns: { [id: string]: any }): any {
        // 1. search output node
        const fLinkId = Object.keys(links).find((key) => {
            const link = links[key];
            return link.rightNodeId === nodeId && link.rightNodeConnectorId === "0";
        });
        if (!fLinkId) {
            console.log("no node id");
            return;
        }

        const fOutId = links[fLinkId].leftNodeId;
        this.functionCalls.unshift({
            functionOutId: fOutId,
            inputs: fIns,
            propagationValues: {},
            alreadyComputedNodes: [],
            toBeComputed: [[fOutId, false]]
        });
    }

    propagateAll(nodes: NodeCollection, links: LinkCollection) {
        const propagationDict: { [id: string]: number } = {};
        Object.keys(nodes).forEach((nodeId) => {
            createPropagationTree(nodeId, links, 0, propagationDict);
        });
        const propagationList = propagationDictToOrderedList(propagationDict);
        propagationList.forEach((v) => this.tasks.push([v, false]));
    }

    propagateNode(nodeId: string, nodes: NodeCollection, links: LinkCollection) {
        const propagationDict: { [id: string]: number } = {};
        createPropagationTree(nodeId, links, 0, propagationDict);
        const propagationList = propagationDictToOrderedList(propagationDict);

        let fOutId = "";
        propagationList.forEach((k) => {
            if (nodes[k].name === NodeName.FunctionOutputNode) {
                fOutId = k;
            }
        });

        // If one of the node to propagate is a function output node
        if (fOutId !== "") {
            // Search associate function input
            const fOutIdLinks = getInputsLinks(fOutId, links);
            let fInId = "";
            Object.keys(fOutIdLinks).forEach((k) => {
                if (links[k].leftNodeConnectorId === "0") {
                    fInId = links[k].rightNodeId;
                }
            });
            const fIn = nodes[fInId];
            // If function input is found
            if (fIn && fIn.name === NodeName.FunctionInputNode) {
                const funName = fIn.connectors["0"].data.value;
                const functionCallersNodeIds: string[] = [];
                // Find each function caller and call them
                Object.keys(nodes).forEach((k) => {
                    if (
                        nodes[k].name === NodeName.FunctionCallNode &&
                        nodes[k].connectors["0"].data.value === funName
                    ) {
                        functionCallersNodeIds.push(k);
                    }
                    if (
                        nodes[k].name === NodeName.Map &&
                        nodes[k].connectors["2"].data.value === funName
                    ) {
                        functionCallersNodeIds.push(k);
                    }
                    if (
                        nodes[k].name === NodeName.LambdaCall &&
                        nodes[k].connectors["0"].data.value === funName
                    ) {
                        functionCallersNodeIds.push(k);
                    }
                });
                functionCallersNodeIds.forEach((k) => this.propagateNode(k, nodes, links));
            }
        }
        // Else, run nominal transformation
        else {
            propagationList.forEach((v) => this.tasks.push([v, false]));
        }
    }

    runAll(
        nodes: NodeCollection,
        links: LinkCollection,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ) {
        while (this.functionCalls.length > 0 || this.tasks.length > 0) {
            if (this.functionCalls.length > 0) {
                this.runFunctionTask(nodes, links, setNodes);
            } else {
                this.runTask(nodes, links, setNodes);
            }
        }
    }

    runFunctionTask(
        nodes: NodeCollection,
        links: LinkCollection,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ) {
        const functionCall = this.functionCalls[0];
        const nodeId = functionCall.toBeComputed[0][0];

        if (nodeId) {
            const node = nodes[nodeId] as Node;
            const outputsLinks = getInputsLinks(nodeId, links);
            const outputsNodes = Object.keys(outputsLinks).map((k) => {
                return links[k].rightNodeId;
            });

            let readyToCompute = true;
            if (node.name === NodeName.IfElse) {
                Object.keys(outputsLinks).forEach((ifLinkId) => {
                    if (links[ifLinkId].leftNodeConnectorId === "1") {
                        if (ifLinkId in functionCall.propagationValues) {
                            const res = functionCall.propagationValues[ifLinkId] as boolean;
                            Object.keys(outputsLinks).forEach((k) => {
                                if (
                                    (links[k].leftNodeConnectorId === "2" && res) ||
                                    (links[k].leftNodeConnectorId === "3" && !res)
                                ) {
                                    const id = links[k].rightNodeId;
                                    if (!functionCall.alreadyComputedNodes.includes(id)) {
                                        readyToCompute = false;
                                        functionCall.toBeComputed.unshift([id, false]);
                                    }
                                }
                            });
                        } else {
                            readyToCompute = false;
                            functionCall.toBeComputed.unshift([links[ifLinkId].rightNodeId, false]);
                        }
                    }
                });
            } else {
                outputsNodes.forEach((depNodeId) => {
                    if (!functionCall.alreadyComputedNodes.includes(depNodeId)) {
                        readyToCompute = false;
                        functionCall.toBeComputed.unshift([depNodeId, false]);
                    }
                });
            }

            if (readyToCompute) {
                // Preparing inputs of current propagation
                const inputLinks = getInputsLinks(nodeId, links);
                const inputValues: { [id: string]: any } = {};
                Object.keys(inputLinks).forEach((linkId) => {
                    if (!(linkId in functionCall.propagationValues)) {
                        return;
                    }
                    const pinId = links[linkId].leftNodeConnectorId;
                    if (pinId in node.connectors) {
                        if (node.connectors[pinId].isMultiInputAllowed) {
                            if (!(pinId in inputValues)) {
                                inputValues[pinId] = [];
                            }
                            inputValues[pinId].push(functionCall.propagationValues[linkId]);
                        } else {
                            inputValues[pinId] = functionCall.propagationValues[linkId];
                        }
                    }
                });
                // Computing current node
                if (!functionCall.toBeComputed[0][1]) {
                    functionCall.toBeComputed[0][1] = node.registerfunctionRun(
                        inputValues,
                        nodeId,
                        setNodes,
                        nodes,
                        links,
                        this
                    );
                    if (functionCall.toBeComputed[0][1]) {
                        return;
                    }
                }
                const outputValues = node.computeSpecific(
                    node.name === NodeName.FunctionInputNode ? functionCall.inputs : inputValues,
                    nodeId,
                    () => {},
                    nodes,
                    links,
                    this
                );
                // Adding values to propagationValues
                const ouputsLinks = getOutputLinks(nodeId, links);
                Object.keys(ouputsLinks).forEach((linkId) => {
                    functionCall.propagationValues[linkId] =
                        outputValues[links[linkId].rightNodeConnectorId];
                });
                functionCall.alreadyComputedNodes.push(nodeId);
                functionCall.toBeComputed.shift();
            }

            if (functionCall.toBeComputed.length === 0) {
                const fLinkResId = Object.keys(links).find((key) => {
                    const link = links[key];
                    return (
                        link.leftNodeId === functionCall.functionOutId &&
                        link.leftNodeConnectorId === "1"
                    );
                });
                if (fLinkResId && fLinkResId in functionCall.propagationValues) {
                    this.functionResults.push(functionCall.propagationValues[fLinkResId]);
                    this.functionCalls.shift();
                } else {
                    this.functionResults.push(undefined);
                    this.functionCalls.shift();
                }
            }
        }
    }

    runTask(
        nodes: NodeCollection,
        links: LinkCollection,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ) {
        const propagingNodeId = this.tasks[0];
        if (propagingNodeId) {
            const node = nodes[propagingNodeId[0]] as Node;
            // Preparing inputs of current propagation
            const inputLinks = getInputsLinks(propagingNodeId[0], links);
            const inputValues: { [id: string]: any } = {};
            Object.keys(inputLinks).forEach((linkId) => {
                if (!(linkId in this.propagationValues)) {
                    return;
                }
                const pinId = links[linkId].leftNodeConnectorId;
                if (node.connectors[pinId] && node.connectors[pinId].isMultiInputAllowed) {
                    if (!(pinId in inputValues)) {
                        inputValues[pinId] = [];
                    }
                    inputValues[pinId].push(this.propagationValues[linkId]);
                } else if (node.connectors[pinId]) {
                    inputValues[pinId] = this.propagationValues[linkId];
                }
            });
            // Executing
            if (!propagingNodeId[1]) {
                this.tasks[0][1] = node.registerfunctionRun(
                    inputValues,
                    propagingNodeId[0],
                    setNodes,
                    nodes,
                    links,
                    this
                );
                if (this.tasks[0][1]) {
                    return;
                }
            }
            const outputValues = node.computeSpecific(
                inputValues,
                propagingNodeId[0],
                setNodes,
                nodes,
                links,
                this
            );
            // Adding values to propagationValues
            const ouputsLinks = getOutputLinks(propagingNodeId[0], links);
            Object.keys(ouputsLinks).forEach((linkId) => {
                this.propagationValues[linkId] = outputValues[links[linkId].rightNodeConnectorId];
            });
            this.tasks.shift();
        }
    }
}

export default abstract class Node implements NodeModel {
    [immerable] = true;
    public name: string;
    public position: XYPosition;
    public width: number;
    public connectors: ConnectorCollection;
    public category: string;

    constructor(
        name: string,
        category: string,
        width: number,
        position: XYPosition,
        connectors: ConnectorCollection
    ) {
        this.name = name;
        this.category = category;
        this.width = width;
        this.position = position;
        this.connectors = connectors;
    }

    static initFromJson(jsonObj: any, node: Node) {
        node.name = jsonObj.name;
        node.category = jsonObj.category;
        node.width = jsonObj.width;
        node.position = jsonObj.position;
        node.connectors = jsonObj.connectors;
    }

    public registerfunctionRun(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>,
        nodes: NodeCollection,
        links: LinkCollection,
        queue: TaskQueue
    ): boolean {
        return false;
    }
    abstract computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>,
        nodes: NodeCollection,
        links: LinkCollection,
        queue: TaskQueue
    ): { [id: string]: any };
}
