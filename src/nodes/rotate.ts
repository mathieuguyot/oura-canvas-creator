/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { NodeCollection, PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import produce from "immer";

export default class RotateNode extends Node {
    constructor() {
        super(NodeName.Rotate, 150, {x:0, y:0}, {
            0: { name: "draw", pinLayout: PinLayout.BOTH_PINS, contentType: "none", data: {} },
            1: {
                name: "angle",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0 }
            }
        });
    }

    static createFromJson(jsonObj: any) : RotateNode {
        let node = new RotateNode();
        Node.initFromJson(jsonObj, node);
        return node;
    }

    protected computeSpecific(inputs: { [id: string]: any }, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): { [id: string]: any } {
        let rotation = "1" in inputs ? inputs[1][0] : this.connectors[1].data.value;
        rotation = (rotation * Math.PI) / 180;
        
        setNodes(
            nodes => produce(nodes, (draft: NodeCollection) => {
                draft[nodeId].connectors[1].data.disabled = "1" in inputs;
                draft[nodeId].connectors[1].data.value = rotation;
            })
        );
        
        const drawWithRotation = (ctx: CanvasRenderingContext2D): void => {
            ctx.rotate(rotation);
            if (inputs[0]) {
                inputs[0].forEach((draw: (arg0: CanvasRenderingContext2D) => void) => {
                    draw(ctx);
                });
            }
            ctx.rotate(-rotation);
        };
        return { "0": drawWithRotation };
    }
}
