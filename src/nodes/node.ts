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
        if(link.inputNodeId === nodeId) {
            linkOutputs[linkKey] = links[linkKey];
        }
    });
    return linkOutputs;
}

function getInputsLinks(nodeId: string, links: LinkCollection): LinkCollection {
    const linkOutputs: LinkCollection = {};
    Object.keys(links).forEach((linkKey) => {
        const link = links[linkKey];
        if(link.outputNodeId === nodeId) {
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
        createPropagationTree(links[linkKey].outputNodeId, links, depth + 1, propagationDict);
    });
}

function propagateFromList(propagationList: string[], propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>, fIns: { [id: string]: any }): void {
    propagationList.forEach(propagingNodeId => {
        const node = nodes[propagingNodeId] as Node;
        // Preparing inputs of current propagation
        const inputLinks = getInputsLinks(propagingNodeId, links);
        const inputValues: { [id: string]: any } = {};
        Object.keys(inputLinks).forEach((linkId) => {
            if(!propagationValues[linkId]) {
                return;
            }
            if(!(links[linkId].outputPinId in inputValues)) {
                inputValues[links[linkId].outputPinId] = [];
            }
            inputValues[links[linkId].outputPinId].push(propagationValues[linkId]);
        });
        // Executing
        const outputValues = node.computeSpecific(node.name === NodeName.FunctionInputNode ? fIns : inputValues, propagingNodeId, setNodes, nodes, links);
        // Adding values to propagationValues
        const ouputsLinks = getOutputLinks(propagingNodeId, links);
        Object.keys(ouputsLinks).forEach((linkId) => {
            propagationValues[linkId] = outputValues[links[linkId].inputPinId];
        });
    });
}

export function propagateAll(propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): void {
    const propagationDict: { [id: string]: number } = {};
    Object.keys(nodes).forEach(nodeId => {
        createPropagationTree(nodeId, links, 0, propagationDict);
    });
    const propagationList = propagationDictToOrderedList(propagationDict);
    propagateFromList(propagationList, propagationValues, nodes, links, setNodes, {});
}

export function propagateNode(nodeId: string, propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): void {
    const propagationDict: { [id: string]: number } = {};
    createPropagationTree(nodeId, links, 0, propagationDict);
    const propagationList = propagationDictToOrderedList(propagationDict);
    propagateFromList(propagationList, propagationValues, nodes, links, setNodes, {});
}

export function propateFunction(nodeId: string, propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>, fIns: { [id: string]: any }): any {
    const propagationDict: { [id: string]: number } = {};
    createPropagationTree(nodeId, links, 0, propagationDict);
    const propagationList = propagationDictToOrderedList(propagationDict);
    const fOutId = propagationList[propagationList.length - 1]
    propagateFromList(propagationList, propagationValues, nodes, links, setNodes, fIns);

    // Return result
    let linkKey = "";
    const link = Object.keys(propagationValues).find((key) => {
        const link = links[key];
        linkKey = key;
        return link.outputNodeId === fOutId && link.outputPinId === "1";
    });
    if(link && linkKey in propagationValues) {
        return propagationValues[linkKey];
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
