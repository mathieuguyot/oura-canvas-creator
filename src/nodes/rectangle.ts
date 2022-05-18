/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class RectangleNode extends Node {
    constructor() {
        super(NodeName.Rectangle, 100, {x:0, y:0}, {
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
            }
        });
    }

    static createFromJson(jsonObj: any) : RectangleNode {
        let node = new RectangleNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        const x = "1" in inputs ? inputs[1][0] : this.connectors[1].data.value;
        const y = "2" in inputs ? inputs[2][0] : this.connectors[2].data.value;
        const width = "3" in inputs ? inputs[3][0] : this.connectors[3].data.value;
        const height = "4" in inputs ? inputs[4][0] : this.connectors[4].data.value;

        setNodes(
            nodes => produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[1].data.disabled = "1" in inputs;
                draft[nodeId].connectors[1].data.value = x;
                draft[nodeId].connectors[2].data.disabled = "2" in inputs;
                draft[nodeId].connectors[2].data.value = y;
                draft[nodeId].connectors[3].data.disabled = "3" in inputs;
                draft[nodeId].connectors[3].data.value = width;
                draft[nodeId].connectors[4].data.disabled = "4" in inputs;
                draft[nodeId].connectors[4].data.value = height;
            })
        );

        const draw = (ctx: CanvasRenderingContext2D): void => {
            ctx.fillRect(x, y, width, height);
        };

        return { "0": draw };
    }
}
