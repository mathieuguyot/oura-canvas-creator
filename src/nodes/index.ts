import { NodeModel } from "oura-node-editor";

import Node from "./node";
import CanvasNode from "./canvas";
import RectangleNode from "./rectangle";
import RotateNode from "./rotate";
import NumberNode from "./number";
import ColorNode from "./color";
import TimerNode from "./timer";
import ModuloNode from "./modulo";
import { NodeName } from "./consts";
import TranslateNode from "./translate";
import IfElseNode from "./if_else";
import StringNode from "./string";
import SplitNode from "./split";

function createNodeSchema(): { [nId: string]: NodeModel } {
    return {
        0: new CanvasNode(),
        1: new RectangleNode(),
        2: new RotateNode(),
        3: new NumberNode(),
        4: new TimerNode(),
        5: new ModuloNode(),
        6: new ColorNode(),
        7: new TranslateNode(),
        8: new IfElseNode(),
        9: new StringNode(),
        10: new SplitNode(),
    };
}

function createNodeFromJson(jsonObj: any) : Node {
    let node: Node | undefined = undefined;
    switch(jsonObj.name) {
        case NodeName.Canvas:
            node = CanvasNode.createFromJson(jsonObj);
            break;
        case NodeName.Color:
            node = ColorNode.createFromJson(jsonObj);
            break;
        case NodeName.Modulo:
            node = ModuloNode.createFromJson(jsonObj);
            break;
        case NodeName.Number:
            node = NumberNode.createFromJson(jsonObj);
            break;
        case NodeName.Rectangle:
            node = RectangleNode.createFromJson(jsonObj);
            break;
        case NodeName.Rotate:
            node = RotateNode.createFromJson(jsonObj);
            break;
        case NodeName.Timer:
            node = TimerNode.createFromJson(jsonObj);
            break;
        case NodeName.Translate:
            node = TranslateNode.createFromJson(jsonObj);
            break;
        case NodeName.IfElse:
            node = IfElseNode.createFromJson(jsonObj);
            break;
        case NodeName.String:
            node = StringNode.createFromJson(jsonObj);
            break;
        case NodeName.Split:
            node = SplitNode.createFromJson(jsonObj);
    }
    if(!node) {
        throw new Error("Error while reading node from json"); 
    }
    return node;
}

export { Node, CanvasNode, createNodeSchema, createNodeFromJson };
