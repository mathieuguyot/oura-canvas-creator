/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class ArcNode extends Node {
    constructor() {
        super(NodeName.Arc, 200, {x:0, y:0}, {
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
                name: "radius",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 100, disabled: false }
            },
            4: {
                name: "start angle",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0, disabled: false }
            },
            5: {
                name: "end angle",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 2 * Math.PI, disabled: false }
            },
            6: {
                name: "color",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "none",
                data: { value: "black" },
                leftPinColor: "orange"
            },
            7: {
                name: "type",
                pinLayout: PinLayout.NO_PINS,
                contentType: "select",
                data: { 
                    values: ["fill", "stroke"],
                    selected_index: 0
                }
            },
            8: {
                name: "line width",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 1, disabled: false }
            },
            9: {
                name: "counterclockwise",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "check_box",
                data: { value: false }
            },
        });
    }

    static createFromJson(jsonObj: any) : ArcNode {
        let node = new ArcNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        const x = "1" in inputs ? inputs[1][0] : this.connectors[1].data.value;
        const y = "2" in inputs ? inputs[2][0] : this.connectors[2].data.value;
        const radius = "3" in inputs ? inputs[3][0] : this.connectors[3].data.value;
        const start_angle = "4" in inputs ? inputs[4][0] : this.connectors[4].data.value;
        const end_angle = "5" in inputs ? inputs[5][0] : this.connectors[5].data.value;
        const color = "6" in inputs ? inputs[6][0] : this.connectors[6].data.value;
        const lineWidth = "8" in inputs ? inputs[8][0] : this.connectors[8].data.value;
        const counterclockwise = "9" in inputs ? inputs[9][0] : this.connectors[9].data.value;

        setNodes(
            nodes => produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[1].data.disabled = "1" in inputs;
                draft[nodeId].connectors[1].data.value = x;
                draft[nodeId].connectors[2].data.disabled = "2" in inputs;
                draft[nodeId].connectors[2].data.value = y;
                draft[nodeId].connectors[3].data.disabled = "3" in inputs;
                draft[nodeId].connectors[3].data.value = radius;
                draft[nodeId].connectors[4].data.disabled = "4" in inputs;
                draft[nodeId].connectors[4].data.value = start_angle;
                draft[nodeId].connectors[5].data.disabled = "5" in inputs;
                draft[nodeId].connectors[5].data.value = end_angle;
                draft[nodeId].connectors[8].data.disabled = "8" in inputs;
                draft[nodeId].connectors[8].data.value = lineWidth;
            })
        );

        const type = this.connectors[7].data.selected_index;
        const draw = (ctx: CanvasRenderingContext2D): void => {
            if(type === 0) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, radius, start_angle, end_angle, counterclockwise);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = "black";
            }
            else if(type === 1) {
                ctx.strokeStyle = color;
                const oldLineWidth = ctx.lineWidth;
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.arc(x, y, radius, start_angle, end_angle, counterclockwise);
                ctx.closePath();
                ctx.stroke();
                ctx.lineWidth = oldLineWidth;
                ctx.strokeStyle = "black";
            }
        };

        return { "0": draw };
    }
}
