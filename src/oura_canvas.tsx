import React from "react";
import { produce } from "immer";
import _ from "lodash";

import {
    NodeEditor,
    LinkModel,
    PanZoomModel,
    generateUuid,
    ConnectorModel,
    NodeCollection,
    LinkCollection,
    NodeModel,
    XYPosition,
    SelectionItem,
    AddNodeContextualMenu,
    SelectionManagementContextualMenu
} from "oura-node-editor";
import { createNodeSchema, Node } from "./nodes";
import CanvasNode from "./nodes/canvas";
import { createCustomConnectorsContents } from "./connector_content";
// import { dumbLinkCreator, dumbNodeCreator } from "./debug";

const OuraCanvasApp = (): JSX.Element => {
    const [nodePickerPos, setNodePickerPos] = React.useState<XYPosition | null>(null);
    const [nodePickerOnMouseHover, setNodePickerOnMouseHover] = React.useState<boolean>(false);
    const [panZoomInfo, setPanZoomInfo] = React.useState<PanZoomModel>({
        zoom: 1,
        topLeftCorner: { x: 0, y: 0 }
    });
    const [selectedItems, setSelectedItems] = React.useState<SelectionItem[]>([]);
    const [nodes, setNodes] = React.useState<NodeCollection>(/*dumbNodeCreator()*/{});
    const [links, setLinks] = React.useState<LinkCollection>(/*dumbLinkCreator(nodes)*/{});
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const nodesSchemas: { [nId: string]: NodeModel } = createNodeSchema(canvasRef);

    const redrawCanvas = React.useCallback((curNodes: NodeCollection, curLink: LinkCollection) => {
        Object.keys(curNodes).forEach((key) => {
            const node = curNodes[key];
            if (node instanceof CanvasNode) {
                try {
                    (node as Node).compute(curNodes, curLink);
                } catch(e) {
                    // Display error in case of compute failure
                    if(canvasRef.current) {
                        const ctx = canvasRef.current.getContext("2d");
                        if (ctx) {
                            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            ctx.fillStyle = "red";
                            ctx.fillText(e, 10, 10);
                            ctx.fillStyle = "black";
                        }
                    }
                }
            }
        });
    }, []);

    const onNodeMove = React.useCallback(
        (id: string, newX: number, newY: number, newWidth: number) => {
            const newNodes = produce(nodes, (draft: NodeCollection) => {
                draft[id].position = { x: newX, y: newY };
                draft[id].width = newWidth;
            });
            setNodes(newNodes);
        },
        [nodes]
    );

    const onCreateLink = React.useCallback(
        (link: LinkModel) => {
            const newLinks = produce(links, (draft) => {
                draft[generateUuid()] = link;
            });
            setLinks(newLinks);
            redrawCanvas(nodes, newLinks);
        },
        [nodes, links, redrawCanvas]
    );

    const onDeleteSelection = React.useCallback(
        () => {
            const newNodes = produce(nodes, (draft: NodeCollection) => {
                selectedItems.forEach((item: SelectionItem) => {
                    if(item.type === "node") {
                        delete draft[item.id];
                    }
                });
            });
            const newLinks = produce(links, (draft: LinkCollection) => {
                Object.keys(links).forEach(linkKey => {
                    const link = links[linkKey];
                    if (!(link.inputNodeId in newNodes) || !(link.outputNodeId in newNodes)) {
                        delete draft[linkKey];
                    }
                });
                selectedItems.forEach((item: SelectionItem) => {
                    if(item.type === "link") {
                        delete draft[item.id];
                    }
                });
            });
            setNodes(newNodes);
            setLinks(newLinks);
            redrawCanvas(newNodes, newLinks);
        },
        [nodes, links, selectedItems, setNodes, setLinks, redrawCanvas]
    );

    const onNodeSelection = React.useCallback(
        (id: string) => {
            if (nodePickerPos) {
                const newNode = _.clone(nodesSchemas[id]);
                const newX =
                    -panZoomInfo.topLeftCorner.x / panZoomInfo.zoom +
                    nodePickerPos.x / panZoomInfo.zoom;
                const newY =
                    -panZoomInfo.topLeftCorner.y / panZoomInfo.zoom +
                    nodePickerPos.y / panZoomInfo.zoom;
                newNode.position = { x: newX, y: newY };
                const newNodes = produce(nodes, (draft) => {
                    draft[generateUuid()] = newNode;
                });
                setNodes(newNodes);
                setNodePickerOnMouseHover(false);
                setNodePickerPos(null);
            }
        },
        [panZoomInfo, nodes, nodePickerPos, nodesSchemas]
    );

    const onConnectorUpdate = React.useCallback(
        (nodeId: string, cId: string, connector: ConnectorModel) => {
            const newNodes = produce(nodes, (draft) => {
                draft[nodeId].connectors[cId] = connector;
            });
            setNodes(newNodes);
            redrawCanvas(newNodes, links);
        },
        [nodes, links, redrawCanvas]
    );

    const onContextMenu = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            event.preventDefault();
            if (!nodePickerPos) {
                setNodePickerPos({ x: event.pageX, y: event.pageY });
            } else {
                setNodePickerOnMouseHover(false);
                setNodePickerPos(null);
            }
        },
        [nodePickerPos]
    );

    const onMouseDown = React.useCallback(
        () => {
            if(nodePickerPos && !nodePickerOnMouseHover) {
                setNodePickerOnMouseHover(false);
                setNodePickerPos(null);
            }
        },
        [nodePickerOnMouseHover, nodePickerPos, setNodePickerPos]
    );

    const canvas = (
        <canvas
            width={640}
            height={480}
            style={{
                width: 640,
                height: 480,
                position: "absolute",
                right: 20,
                bottom: 20,
                backgroundColor: "white"
            }}
            ref={canvasRef}
        />
    );

    let nodePicker = null;
    if(nodePickerPos && selectedItems.length === 0) {
        nodePicker = <div
                style={{
                    width: 640,
                    height: 480,
                    position: "absolute",
                    top: nodePickerPos.y,
                    left: nodePickerPos.x,
                    backgroundColor: "white"
                }}>
                <AddNodeContextualMenu 
                    nodesSchema={nodesSchemas}
                    onNodeSelection={onNodeSelection}
                    onMouseHover={setNodePickerOnMouseHover}
                    createCustomConnectorComponent={createCustomConnectorsContents}
                />
            </div>;
    }
    else if(nodePickerPos) {
        nodePicker = <div
            style={{
                width: 640,
                height: 480,
                position: "absolute",
                top: nodePickerPos.y,
                left: nodePickerPos.x,
                backgroundColor: "white"
            }}>
                <SelectionManagementContextualMenu
                    onMouseHover={setNodePickerOnMouseHover}
                    onDeleteSelection={onDeleteSelection}
                />
            </div>
    }


    return (
        <>
            <div
                style={{ width: "100%", height: "100%" }}
                onContextMenu={onContextMenu}
                onMouseDown={onMouseDown}
                tabIndex={0}>
                <NodeEditor
                    panZoomInfo={panZoomInfo}
                    nodes={nodes}
                    links={links}
                    selectedItems={selectedItems}
                    onPanZoomInfo={setPanZoomInfo}
                    onSelectedItems={setSelectedItems}
                    onNodeMove={onNodeMove}
                    onCreateLink={onCreateLink}
                    onConnectorUpdate={onConnectorUpdate}
                    createCustomConnectorComponent={createCustomConnectorsContents}
                />
                {canvas}
                {nodePicker}
            </div>
        </>
    );
};

export default OuraCanvasApp;
