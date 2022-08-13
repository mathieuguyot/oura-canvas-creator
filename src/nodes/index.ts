import { NodeModel } from "oura-node-editor";

import Node, { UserNode } from "./node";
import CanvasNode from "./canvas";
import RectangleNode from "./rectangle";
import RotateNode from "./rotate";
import NumberNode from "./number";
import ColorNode from "./color";
import TimerNode from "./timer";
import TranslateNode from "./translate";
import IfElseNode from "./if_else";
import StringNode from "./string";
import SplitNode from "./split";
import OperationNode from "./operation";
import LogNode from "./log";
import ArcNode from "./arc";
import CheckNode from "./check";
import BooleanNode from "./boolean";
import { FunctionInputNode, FunctionOutputNode } from "./function";

function createNodeSchema(): { [nId: string]: NodeModel } {
    return {
        0: new CanvasNode(),
        1: new RectangleNode(),
        2: new RotateNode(),
        3: new NumberNode(),
        4: new TimerNode(),
        5: new ColorNode(),
        6: new TranslateNode(),
        7: new IfElseNode(),
        8: new StringNode(),
        9: new SplitNode(),
        10: new OperationNode(),
        11: new LogNode(),
        12: new ArcNode(),
        13: new CheckNode(),
        14: new BooleanNode(),
        15: new FunctionInputNode(),
        16: new FunctionOutputNode()
    };
}

function createNodeFromJson(jsonObj: any) : Node {
    //let node: Node | undefined = undefined;
    /*switch(jsonObj.name) {
        case NodeName.Canvas:
            node = CanvasNode.createFromJson(jsonObj);
            break;
        case NodeName.Color:
            node = ColorNode.createFromJson(jsonObj);
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
            break;
        case NodeName.Operation:
            node = OperationNode.createFromJson(jsonObj);
            break;
        case NodeName.Log:
            node = LogNode.createFromJson(jsonObj);
            break;
        case NodeName.Arc:
            node = ArcNode.createFromJson(jsonObj);
            break;
        case NodeName.Check:
            node = CheckNode.createFromJson(jsonObj);
            break;
        case NodeName.Boolean:
            node = BooleanNode.createFromJson(jsonObj);
            break;
        case NodeName.FunctionInputNode:
            node = FunctionInputNode.createFromJson(jsonObj);
            break;
        case NodeName.FunctionOutputNode:
            node = FunctionOutputNode.createFromJson(jsonObj);
            break;
    }
    if(!node) {
        throw new Error("Error while reading node from json"); 
    }*/
    //return node;
    return UserNode.createFromJson(jsonObj);
}

export { Node, CanvasNode, createNodeSchema, createNodeFromJson };
