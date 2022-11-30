import { NodeCollection, NodeModel } from "oura-node-editor";

import Node from "./node";
import CanvasNode from "./canvas";
import RectangleNode from "./rectangle";
import RotateNode from "./rotate";
import NumberNode from "./number";
import ColorNode from "./color";
import TimerNode from "./timer";
import { NodeName } from "./consts";
import TranslateNode from "./translate";
import IfElseNode from "./if_else";
import StringNode from "./string";
import SplitNode from "./split";
import OperationNode from "./operation";
import LogNode from "./log";
import ArcNode from "./arc";
import CheckNode from "./check";
import BooleanNode from "./boolean";
import { FunctionCallNode, FunctionInputNode, FunctionOutputNode, LambdaCallNode } from "./function";
import ThreeJS from "./threejs";
import ThreeJSBox from "./threejs_box";
import RangeNode from "./range";
import { MapNode } from "./map";
import TextAreaNode from "./textArea";
import { PopNode, ShiftNode } from "./pop";
import LengthNode from "./length";
import { ObjectCreatorNode, ObjectExtractorNode } from "./object";

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
        16: new FunctionOutputNode(),
        17: new FunctionCallNode(),
        18: new ThreeJS(),
        19: new ThreeJSBox(),
        20: new RangeNode(),
        21: new MapNode(),
        22: new TextAreaNode(),
        23: new PopNode(),
        24: new LengthNode(),
        25: new ShiftNode(),
        26: new ObjectCreatorNode(),
        27: new ObjectExtractorNode(),
        28: new LambdaCallNode()
    };
}

function createNodeFromJson(jsonObj: any, nodeId: string, setNodes: React.Dispatch<React.SetStateAction<NodeCollection>>): Node {
    let node: Node | undefined = undefined;
    switch (jsonObj.name) {
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
            node = FunctionInputNode.createFromJson(jsonObj, nodeId, setNodes);
            break;
        case NodeName.FunctionOutputNode:
            node = FunctionOutputNode.createFromJson(jsonObj);
            break;
        case NodeName.FunctionCallNode:
            node = FunctionCallNode.createFromJson(jsonObj);
            break;
        case NodeName.ThreeJS:
            node = ThreeJS.createFromJson(jsonObj);
            break;
        case NodeName.ThreeJSBox:
            node = ThreeJSBox.createFromJson(jsonObj);
            break;
        case NodeName.Range:
            node = RangeNode.createFromJson(jsonObj);
            break;
        case NodeName.Map:
            node = MapNode.createFromJson(jsonObj);
            break;
        case NodeName.TextArea:
            node = TextAreaNode.createFromJson(jsonObj);
            break;
        case NodeName.Pop:
            node = PopNode.createFromJson(jsonObj);
            break;
        case NodeName.Length:
            node = LengthNode.createFromJson(jsonObj);
            break;
        case NodeName.Shift:
            node = ShiftNode.createFromJson(jsonObj);
            break;
        case NodeName.ObjectCreatorNode:
            node = ObjectCreatorNode.createFromJson(jsonObj, nodeId, setNodes);
            break;
        case NodeName.ObjectExtractorNode:
            node = ObjectExtractorNode.createFromJson(jsonObj, nodeId, setNodes);
            break;
        case NodeName.LambdaCall:
            node = LambdaCallNode.createFromJson(jsonObj, nodeId, setNodes);
            break;
    }
    if (!node) {
        throw new Error("Error while reading node from json");
    }
    return node;
}

export { Node, CanvasNode, createNodeSchema, createNodeFromJson };
