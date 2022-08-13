/* eslint-disable @typescript-eslint/no-explicit-any */
import { immerable } from "immer";
import {
    ConnectorCollection,
    LinkCollection,
    NodeCollection,
    NodeModel,
    XYPosition
} from "oura-node-editor";
import { Dispatch, SetStateAction } from "react";

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

function propagateFromList(propagationList: string[], propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): void {
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
        const outputValues = node.computeSpecific(inputValues, propagingNodeId, setNodes);
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
    propagateFromList(propagationList, propagationValues, nodes, links, setNodes);
}

export function propagateNode(nodeId: string, propagationValues: { [id: string]: any }, nodes: NodeCollection, links: LinkCollection, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): void {
    const propagationDict: { [id: string]: number } = {};
    createPropagationTree(nodeId, links, 0, propagationDict);
    const propagationList = propagationDictToOrderedList(propagationDict);
    propagateFromList(propagationList, propagationValues, nodes, links, setNodes);
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

    abstract computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any };
}

export class UserNode extends Node {
    public code: string;
    
    constructor(name: string, width: number, position: XYPosition, connectors: ConnectorCollection) {
        super(name, width, position, connectors);    
        this.code = `(function main(inputs, nodeId, setNodes) {\n\tconsole.log(this);\n\treturn {"test": 10};\n});`;
    }

    static createFromJson(jsonObj: any) : UserNode {
        let node = new UserNode("", 100, {x: 0, y: 0}, {});
        Node.initFromJson(jsonObj, node);
        node.code = jsonObj.code;
        return node;
    }

    async computeSpecific(inputs: { [id: string]: any; }, nodeId: string, setNodes: Dispatch<SetStateAction<NodeCollection>>): Promise<{ [id: string]: any; }> {
        let res = {};
        // https://stackoverflow.com/questions/63459014/data-uri-imports-in-typescript
        import(`data:text/javascript;charset=utf-8;base64,${btoa(this.code)}`);
        //await import(dataUri).then(ns => res = ns.main(inputs, nodeId, setNodes));
        return res; // todo raise error
    }
}