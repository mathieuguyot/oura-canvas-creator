import { NodeModel } from "oura-node-editor";

import Node from "./node";
import CanvasNode from "./canvas";
import RectangleNode from "./rectangle";
import RotateNode from "./rotate";
import NumberNode from "./number";
import ColorNode from "./color";

function createNodeSchema(
    canvasRef: React.RefObject<HTMLCanvasElement>
): { [nId: string]: NodeModel } {
    return {
        0: new CanvasNode(canvasRef),
        1: new RectangleNode(),
        2: new RotateNode(),
        3: new NumberNode(),
        4: new ColorNode()
    };
}

export { Node, CanvasNode, createNodeSchema };
