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
        if(link.outputNodeId === nodeId) {
            linkOutputs[linkKey] = links[linkKey];
        }
    });
    return linkOutputs;
}

function getInputsLinks(nodeId: string, links: LinkCollection): LinkCollection {
    const linkOutputs: LinkCollection = {};
    Object.keys(links).forEach((linkKey) => {
        const link = links[linkKey];
        if(link.inputNodeId === nodeId) {
            linkOutputs[linkKey] = links[linkKey];
        }
    });
    return linkOutputs;
}

function propagationDictToOrderedList(propagationDict: { [id: string]: number }) : string[] {
    const propagationList: [string, number][] = [];
    Object.keys(propagationDict).forEach(nodeId => propagationList.push([nodeId, propagationDict[nodeId]]));
    propagationList.sort((a, b) => a[1] - b[1]);
    return propagationList.map(([nodeId, _]) => nodeId);
}

function createPropagationTree(nodeId: string, links: LinkCollection, depth: number, propagationDict: { [id: string]: number }): void {
    propagationDict[nodeId] = nodeId in propagationDict ? Math.max(depth, propagationDict[nodeId]) : depth;
    const outputLinks = getOutputLinks(nodeId, links);
    Object.keys(outputLinks).forEach(linkKey => {
        createPropagationTree(links[linkKey].inputNodeId, links, depth + 1, propagationDict);
    });
}

function debugLinkConnection(lc: LinkCollection, nodes: NodeCollection) {
   const s = Object.keys(lc).map(k => debugLink(k, nodes, lc));
   s.forEach(s => console.log(s));
}

function debugLink(linkId: string, nodes: NodeCollection, links: LinkCollection): string {
    const link = links[linkId];
    return `${nodes[link.outputNodeId].name}.${link.outputPinId} -> ${nodes[link.inputNodeId].name}.${link.inputPinId}`
}

function propagateFromList(propagationList: string[], propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): void {
    propagationList.forEach(propagingNodeId => {
        const node = nodes[propagingNodeId] as Node;
        // Preparing inputs of current propagation
        const inputLinks = getInputsLinks(propagingNodeId, links);
        const inputValues: { [id: string]: any } = {};
        Object.keys(inputLinks).forEach((linkId) => {
            if(!(linkId in propagationValues)) {
                return;
            }
            const pinId = links[linkId].inputPinId;
            if(node.connectors[pinId].isMultiInputAllowed) {
                if(!(pinId in inputValues)){
                    inputValues[pinId] = [];
                }
                inputValues[pinId].push(propagationValues[linkId]);
            } else {
                inputValues[pinId] = propagationValues[linkId];
            }
        });
        // Executing
        const outputValues = node.computeSpecific(inputValues, propagingNodeId, setNodes, nodes, links);
        // Adding values to propagationValues
        const ouputsLinks = getOutputLinks(propagingNodeId, links);
        Object.keys(ouputsLinks).forEach((linkId) => {
            propagationValues[linkId] = outputValues[links[linkId].outputPinId];
        });
    });
}

export function propagateAll(propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): void {
    const propagationDict: { [id: string]: number } = {};
    Object.keys(nodes).forEach(nodeId => {
        createPropagationTree(nodeId, links, 0, propagationDict);
    });
    const propagationList = propagationDictToOrderedList(propagationDict);
    propagateFromList(propagationList, propagationValues, nodes, links, setNodes);
}

export function propagateNode(nodeId: string, propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): void {
    const propagationDict: { [id: string]: number } = {};
    createPropagationTree(nodeId, links, 0, propagationDict);
    const propagationList = propagationDictToOrderedList(propagationDict);

    let fOutGuard = false;
    propagationList.forEach(k => {
        if(nodes[k].name === NodeName.FunctionOutputNode) {
            fOutGuard = true;
        }
    });
    if(fOutGuard) {
        console.log("fout guard");
        return;
    }
    propagateFromList(propagationList, propagationValues, nodes, links, setNodes);
}

export function backPropagateFunctionNodes(alreadyComputedNodes: string[], nodeId: string,  propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>, fIns: { [id: string]: any }): any {
    if(alreadyComputedNodes.includes(nodeId)) {
        return;
    }

    const node = nodes[nodeId] as Node;
    const outputsLinks = getInputsLinks(nodeId, links);
    const outputsNodes = Object.keys(outputsLinks).map(k => {
        return links[k].outputNodeId;
    });

    // Computing output dep
    if(node.name === NodeName.IfElse) {
        // First compute condition
        let ifLinkId = "";
        Object.keys(outputsLinks).forEach(k => {
            if (links[k].inputPinId === "1") {
                ifLinkId = k;
                backPropagateFunctionNodes(alreadyComputedNodes, links[k].outputNodeId, propagationValues, nodes, links, setNodes, fIns);
            }
        });
        const res = propagationValues[ifLinkId] as boolean;
        Object.keys(outputsLinks).forEach(k => {
            if ((links[k].inputPinId === "2" && res) || (links[k].inputPinId === "3" && !res)) {
                backPropagateFunctionNodes(alreadyComputedNodes, links[k].outputNodeId, propagationValues, nodes, links, setNodes, fIns);
            }
        });
    } else if(node.name === NodeName.FunctionOutputNode) {
        Object.keys(outputsLinks).forEach(k => {
            if (links[k].inputPinId === "0") {
                backPropagateFunctionNodes(alreadyComputedNodes, links[k].outputNodeId, propagationValues, nodes, links, setNodes, fIns);
            }
        });
        outputsNodes.forEach(depNodeId => backPropagateFunctionNodes(alreadyComputedNodes, depNodeId, propagationValues, nodes, links, setNodes, fIns));
    } else {
        outputsNodes.forEach(depNodeId => backPropagateFunctionNodes(alreadyComputedNodes, depNodeId, propagationValues, nodes, links, setNodes, fIns));
    }
    
    // Preparing inputs of current propagation
    const inputLinks = getInputsLinks(nodeId, links);
    const inputValues: { [id: string]: any } = {};
    Object.keys(inputLinks).forEach((linkId) => {
        if(!(linkId in propagationValues)) {
            return;
        }
        const pinId = links[linkId].inputPinId;
        if(node.connectors[pinId].isMultiInputAllowed) {
            if(!(pinId in inputValues)){
                inputValues[pinId] = [];
            }
            inputValues[pinId].push(propagationValues[linkId]);
        } else {
            inputValues[pinId] = propagationValues[linkId];
        }
    });
    // Computing current node
    const outputValues = node.computeSpecific(node.name === NodeName.FunctionInputNode ? fIns :  inputValues, nodeId, setNodes, nodes, links);
    // Adding values to propagationValues
    const ouputsLinks = getOutputLinks(nodeId, links);
    Object.keys(ouputsLinks).forEach((linkId) => {
        propagationValues[linkId] = outputValues[links[linkId].outputPinId];
    });
    alreadyComputedNodes.push(nodeId);
}

export function propateFunction(nodeId: string, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>, fIns: { [id: string]: any }): any {
    const propagationValues: { [id: string]: any } = {};
    // 1. search output node
    const fLinkId = Object.keys(links).find((key) => {
        const link = links[key];
        return link.outputNodeId === nodeId && link.outputPinId === "0";
    });
    if(!fLinkId) {
        console.log("no node id");
        return;
    }
    
    const fOutId = links[fLinkId].inputNodeId;
    backPropagateFunctionNodes([], fOutId, propagationValues, nodes, links, setNodes, fIns);
    
    // Return result
    const fLinkResId = Object.keys(links).find((key) => {
        const link = links[key];
        return link.inputNodeId === fOutId && link.inputPinId === "1";
    });
    if(fLinkResId && fLinkResId in propagationValues) {
        return propagationValues[fLinkResId]
    }
    return undefined;
}

export default abstract class Node implements NodeModel {
    [immerable] = true;
    public name: string;
    public position: XYPosition;
    public width: number;
    public connectors: ConnectorCollection;

    constructor(name: string, width: number, position: XYPosition, connectors: ConnectorCollection) {
        this.name = name;
        this.width = width;
        this.position = position;
        this.connectors = connectors;
    }

    static initFromJson(jsonObj: any, node: Node) {
        node.name = jsonObj.name;
        node.width = jsonObj.width;
        node.position = jsonObj.position;
        node.connectors = jsonObj.connectors;
    }

    abstract computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>, nodes: NodeCollection, links: LinkCollection): { [id: string]: any };
}
