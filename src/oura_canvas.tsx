import React, { useCallback, useEffect, useState } from "react";
import { produce } from "immer";

import {
    NodeEditor,
    LinkModel,
    generateUuid,
    ConnectorModel,
    NodeCollection,
    LinkCollection,
    NodeModel,
    XYPosition,
    SelectionItem,
    AddNodeContextualMenu,
    SelectionManagementContextualMenu,
    useNodeEditor
} from "oura-node-editor";
import { createNodeFromJson, createNodeSchema } from "./nodes";
import { createCustomConnectorsContents } from "./connector_content";
import { TaskQueue } from "./nodes/node";
import { useLocalStorage, useSaveLoadReset } from "./custom_hooks";
import BottomActions from "./bottom_actions";

let taskQueue: TaskQueue = new TaskQueue();

const OuraCanvasApp = (): JSX.Element => {
    const {
        nodes,
        links,
        panZoomInfo,
        selectedItems,
        setNodes,
        setLinks,
        onNodeMove,
        setPanZoomInfo,
        setSelectedItems
    } = useNodeEditor();

    const [runFirstPropagation, setRunFirstPropagation] = useState(false);

    useLocalStorage(nodes, links);
    const { onSave, onLoad, onReset } = useSaveLoadReset(
        nodes,
        links,
        setNodes,
        setLinks,
        setRunFirstPropagation,
        taskQueue
    );

    const [nodePickerPos, setNodePickerPos] = useState<XYPosition | null>(null);
    const [nodePickerOnMouseHover, setNodePickerOnMouseHover] = useState<boolean>(false);

    useEffect(() => {
        const locallyStoredNodes = localStorage.getItem("nodes");
        const locallyStoredLinks = localStorage.getItem("links");
        const initNodes: NodeCollection = locallyStoredNodes ? JSON.parse(locallyStoredNodes) : {};
        const initLinks: LinkCollection = locallyStoredLinks ? JSON.parse(locallyStoredLinks) : {};
        if (locallyStoredNodes) {
            Object.keys(initNodes).forEach((key) => {
                initNodes[key] = createNodeFromJson(initNodes[key], key, setNodes);
            });
        }
        setLinks(initLinks);
        setNodes(initNodes);
        setRunFirstPropagation(true);
    }, [setLinks, setNodes]);

    useEffect(() => {
        if (runFirstPropagation) {
            setRunFirstPropagation(false);
            taskQueue.propagateAll(nodes, links);
            taskQueue.runAll(nodes, links, setNodes);
        }
    }, [runFirstPropagation, links, nodes, setNodes]);

    const nodesSchemas: { [nId: string]: NodeModel } = createNodeSchema();

    useEffect(() => {
        const interval = setInterval(() => {
            const updated: string[] = [];
            const newNodes = produce(nodes, (draft: NodeCollection) => {
                for (let key of Object.keys(nodes)) {
                    if (draft[key].name === "timer" && draft[key].connectors[1].data.value) {
                        draft[key].connectors[0].data.value = (
                            Number(draft[key].connectors[0].data.value) + 1
                        ).toString();
                        updated.push(key);
                    }
                }
            });
            if (updated.length > 0) {
                setNodes(newNodes);
                updated.forEach((k) => taskQueue.propagateNode(k, newNodes, links));
                taskQueue.runAll(newNodes, links, setNodes);
            }
        }, 1000 / 60);
        return () => clearInterval(interval);
    }, [nodes, links, setNodes]);

    const onCreateLink = useCallback(
        (link: LinkModel) => {
            setLinks((links) =>
                produce(links, (draft) => {
                    draft[generateUuid()] = link;
                })
            );
            const newLinks = produce(links, (draft) => {
                draft[generateUuid()] = link;
            });
            taskQueue.propagateNode(link.outputNodeId, nodes, newLinks);
            taskQueue.runAll(nodes, newLinks, setNodes);
        },
        [links, nodes, setLinks, setNodes]
    );

    const onDeleteSelection = useCallback(() => {
        const deleteNodeIds = selectedItems
            .filter((value: SelectionItem) => value.type === "node")
            .map((value) => value.id);
        const deletedLinksIds = selectedItems
            .filter((value: SelectionItem) => value.type === "link")
            .map((value) => value.id);
        setNodes((nodes) =>
            produce(nodes, (draft: NodeCollection) => {
                deleteNodeIds.forEach((id) => {
                    delete draft[id];
                });
            })
        );
        setLinks((links) =>
            produce(links, (draft: LinkCollection) => {
                Object.keys(links).forEach((linkKey) => {
                    const link = links[linkKey];
                    if (
                        deleteNodeIds.includes(link.inputNodeId) ||
                        deleteNodeIds.includes(link.outputNodeId)
                    ) {
                        delete draft[linkKey];
                    }
                });
                deletedLinksIds.forEach((id) => {
                    delete draft[id];
                });
            })
        );

        const newNodes = produce(nodes, (draft: NodeCollection) => {
            deleteNodeIds.forEach((id) => {
                delete draft[id];
            });
        });
        const nodeIdToRecompute: string[] = [];
        const newLinks = produce(links, (draft: LinkCollection) => {
            Object.keys(links).forEach((linkKey) => {
                const link = links[linkKey];
                if (
                    deleteNodeIds.includes(link.inputNodeId) ||
                    deleteNodeIds.includes(link.outputNodeId)
                ) {
                    if (
                        deleteNodeIds.includes(link.outputNodeId) &&
                        !deleteNodeIds.includes(link.inputNodeId)
                    ) {
                        nodeIdToRecompute.push(link.inputNodeId);
                    }
                    delete draft[linkKey];
                }
            });
            deletedLinksIds.forEach((id) => {
                delete draft[id];
            });
        });
        // TODO purge taskQueue
        //Object.keys(propagationValues).forEach(key => {
        //    if (!(key in newLinks)) {
        //        delete propagationValues[key];
        //    }
        //});
        nodeIdToRecompute.forEach((nodeId) => {
            taskQueue.propagateNode(nodeId, newNodes, newLinks);
            taskQueue.runAll(newNodes, newLinks, setNodes);
        });
    }, [selectedItems, setNodes, setLinks, nodes, links]);

    const [newNodeId, setNewNodeId] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (newNodeId) {
            taskQueue.propagateNode(newNodeId, nodes, links);
            taskQueue.runAll(nodes, links, setNodes);
            setNewNodeId(undefined);
        }
    }, [newNodeId, nodes, links, setNodes]);

    const onNodeSelection = useCallback(
        (id: string) => {
            if (nodePickerPos) {
                const newNodeId = generateUuid();
                setNodes((nodes) =>
                    produce(nodes, (draft) => {
                        const jsonObj = JSON.parse(JSON.stringify(nodesSchemas[id]));
                        const newNode = createNodeFromJson(jsonObj, newNodeId, setNodes);
                        const newX =
                            -panZoomInfo.topLeftCorner.x / panZoomInfo.zoom +
                            nodePickerPos.x / panZoomInfo.zoom;
                        const newY =
                            -panZoomInfo.topLeftCorner.y / panZoomInfo.zoom +
                            nodePickerPos.y / panZoomInfo.zoom;
                        newNode.position = { x: newX, y: newY };
                        draft[newNodeId] = newNode;
                    })
                );
                setNewNodeId(newNodeId);
                setNodePickerOnMouseHover(false);
                setNodePickerPos(null);
            }
        },
        [
            nodePickerPos,
            setNodes,
            nodesSchemas,
            panZoomInfo.topLeftCorner.x,
            panZoomInfo.topLeftCorner.y,
            panZoomInfo.zoom
        ]
    );

    const onConnectorUpdate = useCallback(
        (nodeId: string, cId: string, connector: ConnectorModel) => {
            setNodes((nodes) =>
                produce(nodes, (draft) => {
                    draft[nodeId].connectors[cId] = connector;
                })
            );
            const newNodes = produce(nodes, (draft) => {
                draft[nodeId].connectors[cId] = connector;
            });
            taskQueue.propagateNode(nodeId, newNodes, links);
            taskQueue.runAll(newNodes, links, setNodes);
        },
        [setNodes, nodes, links]
    );

    const onContextMenu = useCallback(
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

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (nodePickerPos && !nodePickerOnMouseHover) {
                setNodePickerOnMouseHover(false);
                setNodePickerPos(null);
                e.stopPropagation();
            }
        },
        [nodePickerOnMouseHover, nodePickerPos, setNodePickerPos]
    );

    let nodePicker = null;
    if (nodePickerPos && selectedItems.length === 0) {
        nodePicker = (
            <div
                style={{
                    width: 640,
                    height: 500,
                    position: "absolute",
                    top: nodePickerPos.y,
                    left: nodePickerPos.x,
                    backgroundColor: "white"
                }}
            >
                <AddNodeContextualMenu
                    nodesSchema={nodesSchemas}
                    onNodeSelection={onNodeSelection}
                    onMouseHover={setNodePickerOnMouseHover}
                    createCustomConnectorComponent={createCustomConnectorsContents}
                />
            </div>
        );
    } else if (nodePickerPos) {
        nodePicker = (
            <div
                style={{
                    width: 640,
                    height: 480,
                    position: "absolute",
                    top: nodePickerPos.y,
                    left: nodePickerPos.x,
                    backgroundColor: "white"
                }}
            >
                <SelectionManagementContextualMenu
                    onMouseHover={setNodePickerOnMouseHover}
                    onDeleteSelection={onDeleteSelection}
                />
            </div>
        );
    }

    return (
        <>
            <div
                style={{ width: "100%", height: "100%" }}
                onContextMenu={onContextMenu}
                onMouseDown={onMouseDown}
                tabIndex={0}
            >
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
            <BottomActions onSave={onSave} onLoad={onLoad} onReset={onReset} />
        </>
    );
};

export default OuraCanvasApp;
