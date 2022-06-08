/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class CanvasNode extends Node {
    constructor() {
        super(NodeName.Canvas, 430, {x:0, y:0}, {
            0: { 
                name: "draw", 
                pinLayout: PinLayout.LEFT_PIN, 
                contentType: "canvas", 
                data: { canvas_width: 400, canvas_height: 400, canvas_color: "white" } 
            },
            1: { 
                name: "width", 
                pinLayout: PinLayout.LEFT_PIN, 
                contentType: "number", 
                data: { value: 400 } 
            },
            2: { 
                name: "height", 
                pinLayout: PinLayout.LEFT_PIN, 
                contentType: "number", 
                data: { value: 400 } 
            },
            3: {
                name: "color",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "none",
                data: { value: "white" },
                leftPinColor: "orange"
            },
        });
    }

    static createFromJson(jsonObj: any) : CanvasNode {
        let node = new CanvasNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        const width = Number("1" in inputs ? inputs[1][0] : this.connectors[1].data.value);
        const height = Number("2" in inputs ? inputs[2][0] : this.connectors[2].data.value);
        const color = "3" in inputs ? inputs[3][0] : this.connectors[3].data.value;

        if ("canvas_ctx" in this.connectors[0].data) {
            const ctx = this.connectors[0].data.canvas_ctx;
            if("clearRect" in ctx) {
                setNodes(
                    nodes => produce(nodes, (draft: NodeCollection) => {
                        draft[nodeId].connectors[0].data.canvas_width = Number(width);
                        draft[nodeId].connectors[0].data.canvas_height = Number(height);
                        draft[nodeId].connectors[0].data.canvas_color = color;
                        draft[nodeId].connectors[1].data.disabled = "1" in inputs;
                        draft[nodeId].connectors[1].data.value = width;
                        draft[nodeId].connectors[2].data.disabled = "2" in inputs;
                        draft[nodeId].connectors[2].data.value = height;
                    })
                );
                ctx.canvas.width = width;
                ctx.canvas.height = height;
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
