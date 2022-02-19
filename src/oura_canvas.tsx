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
import { createNodeFromJson, createNodeSchema, Node } from "./nodes";
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
    const locallyStoredNodes = localStorage.getItem("nodes");
    const locallyStoredLinks = localStorage.getItem("links");
    const initNodes: NodeCollection = locallyStoredNodes ? JSON.parse(locallyStoredNodes) : {};
    const initLinks: LinkCollection = locallyStoredLinks ? JSON.parse(locallyStoredLinks) : {};
    if(locallyStoredNodes) {
        Object.keys(initNodes).forEach((key) => {
            initNodes[key] = createNodeFromJson(initNodes[key]);
        });
    }
    const [nodes, setNodes] = React.useState<NodeCollection>(initNodes);
    const [links, setLinks] = React.useState<LinkCollection>(initLinks);
    localStorage.setItem("nodes", JSON.stringify(nodes));
    localStorage.setItem("links", JSON.stringify(links));

    const nodesSchemas: { [nId: string]: NodeModel } = createNodeSchema();

    // Redraw canvas effect
    React.useEffect(() => {
        Object.keys(nodes).forEach((key) => {
            const node = nodes[key];
            if (node instanceof CanvasNode) {
                try {
                    (node as Node).compute(nodes, links, setNodes);
                } catch(e: any) {
                    console.error(e);
                }
            }
        });
    }, [nodes, links]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            let updated = false;
            const newNodes = produce(nodes, (draft: NodeCollection) => {
                for (let key of Object.keys(nodes)) {
                    if(draft[key].name === "timer" && draft[key].connectors[1].data.value) {
                        draft[key].connectors[0].data.value = (Number(draft[key].connectors[0].data.value) + 1).toString();
                        updated = true;
                    }
                }
            });
            if(updated) {
                setNodes(newNodes);
            }
        }, 1000 / 60);
        return () => clearInterval(interval);
      }, [nodes, links]);

    const onNodeMove = React.useCallback(
        (id: string, newX: number, newY: number, newWidth: number) => { 
            setNodes(
                nodes => produce(nodes, (draft: NodeCollection) => {
                    draft[id].position = { x: newX, y: newY };
                    draft[id].width = newWidth;
                })
            );
        }, []
    );

    const onCreateLink = React.useCallback(
        (link: LinkModel) => {
            setLinks(
                links => produce(links, (draft) => {
                    draft[generateUuid()] = link;
                })
            );
        }, []
    );

    const onDeleteSelection = React.useCallback(
        () => {
            const deleteNodeIds = selectedItems.filter((value: SelectionItem) => value.type === "node").map((value) => value.id);
            const deletedLinksIds = selectedItems.filter((value: SelectionItem) => value.type === "link").map((value) => value.id);
            setNodes(
                nodes => produce(nodes, (draft: NodeCollection) => {
                    deleteNodeIds.forEach((id) => {
                        delete draft[id];
                    });
                })
            );
            setLinks(
                links => produce(links, (draft: LinkCollection) => {
                    Object.keys(links).forEach(linkKey => {
                        const link = links[linkKey];
                        if (deleteNodeIds.includes(link.inputNodeId) || deleteNodeIds.includes(link.outputNodeId)) {
                            delete draft[linkKey];
                        }
                    });
                    deletedLinksIds.forEach((id) => {
                        delete draft[id];
                    });
                })
            );
        },
        [selectedItems]
    );

    const onNodeSelection = React.useCallback(
        (id: string) => {
            if (nodePickerPos) {
                setNodes(
                    nodes => produce(nodes, (draft) => {
                        const newNode = _.clone(nodesSchemas[id]);
                        const newX =
                            -panZoomInfo.topLeftCorner.x / panZoomInfo.zoom +
                            nodePickerPos.x / panZoomInfo.zoom;
                        const newY =
                            -panZoomInfo.topLeftCorner.y / panZoomInfo.zoom +
                            nodePickerPos.y / panZoomInfo.zoom;
                        newNode.position = { x: newX, y: newY };
                        draft[generateUuid()] = newNode;
                    })
                );
                setNodePickerOnMouseHover(false);
                setNodePickerPos(null);
            }
        },
        [panZoomInfo, nodePickerPos, nodesSchemas]
    );

    const onConnectorUpdate = React.useCallback(
        (nodeId: string, cId: string, connector: ConnectorModel) => {
            setNodes(
                nodes => produce(nodes, (draft) => {
                    draft[nodeId].connectors[cId] = connector;
                })
            );
        }, []
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

    let nodePicker = null;
    if(nodePickerPos && selectedItems.length === 0) {
        nodePicker = <div
                style={{
                    width: 640,
                    height: 500,
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
                {nodePicker}
            </div>
        </>
    );
};

export default OuraCanvasApp;
