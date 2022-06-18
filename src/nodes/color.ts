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
                data: { canvas_width: 150 - 30, canvas_height: 40, canvas_color: "black" },
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
            4: { 
                name: "alpha", 
                pinLayout: PinLayout.LEFT_PIN, 
                contentType: "number", 
                data: { value: 1 } 
            }
        });
    }

    static createFromJson(jsonObj: any) : ColorNode {
        let node = new ColorNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        let red = "1" in inputs ? inputs[1][0] : this.connectors[1].data.value;
        let green = "2" in inputs ? inputs[2][0] : this.connectors[2].data.value;
        let blue = "3" in inputs ? inputs[3][0] : this.connectors[3].data.value;
        let alpha = "4" in inputs ? inputs[4][0] : this.connectors[4].data.value;
        
        red = red > 255 ? 255 : red < 0 ? 0 : red;
        green = green > 255 ? 255 : green < 0 ? 0 : green;
        blue = blue > 255 ? 255 : blue < 0 ? 0 : blue;
        alpha = alpha > 1 ? 1 : alpha < 0 ? 0 : alpha;
        const colorCode = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

        setNodes(
            nodes => produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[0].data.canvas_width = this.width - 30;
                draft[nodeId].connectors[0].data.canvas_color = colorCode;
                draft[nodeId].connectors[1].data.disabled = "1" in inputs;
                draft[nodeId].connectors[1].data.value = red;
                draft[nodeId].connectors[2].data.disabled = "2" in inputs;
                draft[nodeId].connectors[2].data.value = green;
                draft[nodeId].connectors[3].data.disabled = "3" in inputs;
                draft[nodeId].connectors[3].data.value = blue;
                draft[nodeId].connectors[4].data.disabled = "4" in inputs;
                draft[nodeId].connectors[4].data.value = alpha;
            })
        );

        return { "0": colorCode };
    }
}
