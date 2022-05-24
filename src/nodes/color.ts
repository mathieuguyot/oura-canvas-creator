/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class ColorNode extends Node {
    constructor() {
        super(NodeName.Color, 150, {x:0, y:0}, {
            0: { 
                name: "color", 
                pinLayout: PinLayout.RIGHT_PIN, 
                contentType: "canvas", 
                data: { canvas_width: 40, canvas_height: 40 },
                rightPinColor: "orange"
            },
            1: { 
                name: "red", 
                pinLayout: PinLayout.LEFT_PIN, 
                contentType: "number", 
                data: { value: 0 } 
            },
            2: { 
                name: "green", 
                pinLayout: PinLayout.LEFT_PIN, 
                contentType: "number", 
                data: { value: 0 } 
            },
            3: { 
                name: "blue", 
                pinLayout: PinLayout.LEFT_PIN, 
                contentType: "number", 
                data: { value: 0 } 
            },
        });
    }

    static createFromJson(jsonObj: any) : ColorNode {
        let node = new ColorNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        let red = "1" in inputs ? inputs[1][0] : this.connectors[1].data.value;
        let green = "2" in inputs ? inputs[2][0] : this.connectors[2].data.value;
        let blue = "3" in inputs ? inputs[3][0] : this.connectors[3].data.value;
        
        red = red > 255 ? 255 : red < 0 ? 0 : red;
        green = green > 255 ? 255 : green < 0 ? 0 : green;
        blue = blue > 255 ? 255 : blue < 0 ? 0 : blue;

        const colorCode = `rgb(${red}, ${green}, ${blue})`;
        const canvas_width = this.width - 30;
        if ("canvas_ctx" in this.connectors[0].data) {
            const ctx = this.connectors[0].data.canvas_ctx;
            if("clearRect" in ctx) {
                setNodes(
                    nodes => produce(nodes, (draft: NodeCollection) => {
                        draft[nodeId].connectors[0].data.canvas_width = canvas_width;
                        draft[nodeId].connectors[1].data.disabled = "1" in inputs;
                        draft[nodeId].connectors[1].data.value = red;
                        draft[nodeId].connectors[2].data.disabled = "2" in inputs;
                        draft[nodeId].connectors[2].data.value = green;
                        draft[nodeId].connectors[3].data.disabled = "3" in inputs;
                        draft[nodeId].connectors[3].data.value = blue;
                    })
                );
                ctx.canvas.width = canvas_width;

                ctx.fillStyle = colorCode
                ctx.fillRect(0, 0, this.width, this.connectors[0].data.canvas_height);
            }
        }
        return { "0": colorCode };
    }
}
