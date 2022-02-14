/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class TimerNode extends Node {
    constructor() {
        super(NodeName.Timer, 125, {x:0, y:0}, {
            0: { name: "count", pinLayout: PinLayout.RIGHT_PIN, contentType: "number", data: { value: "0" } },
            1: { name: "is_running", pinLayout: PinLayout.LEFT_PIN, contentType: "check_box", data: { value: false } }
        });
    }

    static createFromJson(jsonObj: any) : TimerNode {
        let node = new TimerNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        return { "0": this.connectors[0].data.value };
    }
}
