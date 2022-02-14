/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";

export default class TranslateNode extends Node {
    constructor() {
        super(NodeName.Translate, 100, {x:0, y:0}, {
            0: { name: "draw", pinLayout: PinLayout.BOTH_PINS, contentType: "none", data: {} },
            1: {
                name: "x",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0 }
            },
            2: {
                name: "y",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0 }
            }
        });
    }

    static createFromJson(jsonObj: any) : TranslateNode {
        let node = new TranslateNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        let x = "1" in inputs ? inputs[1][0] : this.connectors[1].data.value;
        let y = "2" in inputs ? inputs[2][0] : this.connectors[2].data.value;
        const drawWithTranslate = (ctx: CanvasRenderingContext2D): void => {
            ctx.translate(x, y);
            if (inputs[0]) {
                inputs[0].forEach((draw: (arg0: CanvasRenderingContext2D) => void) => {
                    draw(ctx);
                });
            }
            ctx.translate(-x, -y);
        };
        return { "0": drawWithTranslate };
    }
}
