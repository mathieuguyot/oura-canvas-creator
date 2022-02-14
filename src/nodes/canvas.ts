/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class CanvasNode extends Node {
    constructor() {
        super(NodeName.Canvas, 830, {x:0, y:0}, {
            0: { name: "draw", pinLayout: PinLayout.LEFT_PIN, contentType: "canvas", data: {} }
        });
    }

    static createFromJson(jsonObj: any) : CanvasNode {
        let node = new CanvasNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        if ("canvas_ctx" in this.connectors[0].data) {
            const ctx = this.connectors[0].data.canvas_ctx;
            if("clearRect" in ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, this.connectors[0].data.canvas_width, this.connectors[0].data.canvas_height);
                ctx.fillStyle = "black";
                if (inputs[0]) {
                    inputs[0].forEach((draw: (arg0: CanvasRenderingContext2D) => void) => {
                        draw(ctx);
                    });
                }
            }
        }
        return {};
    }
}
