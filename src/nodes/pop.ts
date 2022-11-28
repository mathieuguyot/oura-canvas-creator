/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";


export class ShiftNode extends Node {
    constructor() {
        super(NodeName.Shift, 170, { x: 0, y: 0 }, {
            0: {
                name: "array",
                pinLayout: PinLayout.BOTH_PINS,
                contentType: "none",
                data: {}
            },
            1: {
                name: "element",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "none",
                data: {}
            }
        });
    }

    static createFromJson(json: string): ShiftNode {
        let node = new ShiftNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        const array = "0" in inputs ? inputs[0] : [];
        const length = array ? array.length : 0;
        let elem = undefined;
        const newArray = produce(array, (draft: any) => {
            if (length > 0) {
                elem = draft.shift();
            }
        });
        return { "0": newArray, "1": elem };
    }
}

export class PopNode extends Node {
    constructor() {
        super(NodeName.Pop, 170, { x: 0, y: 0 }, {
            0: {
                name: "array",
                pinLayout: PinLayout.BOTH_PINS,
                contentType: "none",
                data: {}
            },
            1: {
                name: "element",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "none",
                data: {}
            }
        });
    }

    static createFromJson(json: string): PopNode {
        let node = new PopNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        const array = "0" in inputs ? inputs[0] : [];
        const length = array ? array.length : 0;
        let elem = undefined;
        const newArray = produce(array, (draft: any) => {
            if (length > 0) {
                elem = draft.pop();
            }
        });
        return { "0": newArray, "1": elem };
    }
}
