/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class ThreeJS extends Node {
    constructor() {
        super(NodeName.ThreeJS, 170, {x:0, y:0}, {
            0: {
                name: "threejs",
                pinLayout: PinLayout.NO_PINS,
                contentType: "threejs",
                data: {}
            }
        });
    }

    static createFromJson(json: string) : ThreeJS {
        let node = new ThreeJS();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(): { [id: string]: any } {
        return {};
    }
}
