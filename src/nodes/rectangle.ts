/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class RectangleNode extends Node {
    constructor() {
        super(
            NodeName.Rectangle,
            200,
            { x: 0, y: 0 },
            {
                0: { name: "draw", pinLayout: PinLayout.RIGHT_PIN, contentType: "none", data: {} },
                1: {
                    name: "x",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "number",
                    data: { value: 0, disabled: false }
                },
                2: {
                    name: "y",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "number",
                    data: { value: 0, disabled: false }
                },
                3: {
                    name: "width",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "number",
                    data: { value: 100, disabled: false }
                },
                4: {
                    name: "height",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "number",
                    data: { value: 100, disabled: false }
                },
                5: {
                    name: "color",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "none",
                    data: { value: "black" },
                    leftPinColor: "orange"
                },
                6: {
                    name: "type",
                    pinLayout: PinLayout.NO_PINS,
                    contentType: "select",
                    data: {
                        values: ["fill", "stroke", "clear"],
                        selected_index: 0
                    }
                },
                7: {
                    name: "line width",
                    pinLayout: PinLayout.LEFT_PIN,
                    contentType: "number",
                    data: { value: 1, disabled: false }
                }
            }
        );
    }

    static createFromJson(jsonObj: any): RectangleNode {
        let node = new RectangleNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    computeSpecific(
        inputs: { [id: string]: any },
        nodeId: string,
        setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>
    ): { [id: string]: any } {
        const x = "1" in inputs ? inputs[1] : this.connectors[1].data.value;
        const y = "2" in inputs ? inputs[2] : this.connectors[2].data.value;
        const width = "3" in inputs ? inputs[3] : this.connectors[3].data.value;
        const height = "4" in inputs ? inputs[4] : this.connectors[4].data.value;
        const color = "5" in inputs ? inputs[5] : this.connectors[5].data.value;
        const lineWidth = "7" in inputs ? inputs[7] : this.connectors[7].data.value;

        setNodes((nodes) =>
            produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[1].data.disabled = "1" in inputs;
                draft[nodeId].connectors[1].data.value = x;
                draft[nodeId].connectors[2].data.disabled = "2" in inputs;
                draft[nodeId].connectors[2].data.value = y;
                draft[nodeId].connectors[3].data.disabled = "3" in inputs;
                draft[nodeId].connectors[3].data.value = width;
                draft[nodeId].connectors[4].data.disabled = "4" in inputs;
                draft[nodeId].connectors[4].data.value = height;
                draft[nodeId].connectors[7].data.disabled = "7" in inputs;
                draft[nodeId].connectors[7].data.value = lineWidth;
            })
        );

        const type = this.connectors[6].data.selected_index;
        const draw = (ctx: CanvasRenderingContext2D): void => {
            if (type === 0) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, width, height);
                ctx.fillStyle = "black";
            } else if (type === 1) {
                ctx.strokeStyle = color;
                const oldLineWidth = ctx.lineWidth;
                ctx.lineWidth = lineWidth;
                ctx.strokeRect(x, y, width, height);
                ctx.lineWidth = oldLineWidth;
                ctx.strokeStyle = "black";
            } else if (type === 2) {
                ctx.clearRect(x, y, width, height);
            }
        };

        return { "0": draw };
    }
}
