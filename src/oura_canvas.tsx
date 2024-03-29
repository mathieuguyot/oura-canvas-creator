import React, { useCallback, useEffect, useState } from "react";
import { produce } from "immer";

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
import { createNodeFromJson, createNodeSchema } from "./nodes";
import { createCustomConnectorsContents } from "./connector_content";
import { TaskQueue } from "./nodes/node";

let taskQueue: TaskQueue = new TaskQueue();

const OuraCanvasApp = (): JSX.Element => {
    const [nodePickerPos, setNodePickerPos] = React.useState<XYPosition | null>(null);
    const [nodePickerOnMouseHover, setNodePickerOnMouseHover] = React.useState<boolean>(false);
    const [panZoomInfo, setPanZoomInfo] = React.useState<PanZoomModel>({
        zoom: 1,
        topLeftCorner: { x: 0, y: 0 }
    });
    const [selectedItems, setSelectedItems] = React.useState<SelectionItem[]>([]);
    const [nodes, setNodes] = React.useState<NodeCollection>({});
    const [links, setLinks] = React.useState<LinkCollection>({});

    const [runFirstPropagation, setRunFirstPropagation] = React.useState(false);
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
    }, []);

    React.useEffect(() => {
        if (runFirstPropagation) {
            setRunFirstPropagation(false);
            taskQueue.propagateAll(nodes, links);
            taskQueue.runAll(nodes, links, setNodes);
        }
    }, [runFirstPropagation, links, nodes]);

    useEffect(() => {
        if (Object.keys(nodes).length > 0) {
            localStorage.setItem("nodes", JSON.stringify(nodes));
        }
    }, [nodes]);
    useEffect(() => {
        if (Object.keys(links).length > 0) {
            localStorage.setItem("links", JSON.stringify(links));
        }
    }, [links]);

    const nodesSchemas: { [nId: string]: NodeModel } = createNodeSchema();

    const setSelectedItemsAndMoveSelectedNodeFront = useCallback((selection: SelectionItem[]) => {
        if (selection.length === 1 && selection[0].type === "node") {
            setNodes((nodes: NodeCollection) => {
                const selectedNodeId = selection[0].id;
                const newNodes: NodeCollection = {};
                Object.keys(nodes).forEach((key) => {
                    if (key !== selectedNodeId) {
                        newNodes[key] = nodes[key];
                    }
                });
                newNodes[selectedNodeId] = nodes[selectedNodeId];
                return newNodes;
            });
        }
        setSelectedItems(selection);
    }, []);

    React.useEffect(() => {
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
    }, [nodes, links]);

    const onNodeMove = React.useCallback(
        (id: string, newX: number, newY: number, newWidth: number) => {
            setNodes((nodes) =>
                produce(nodes, (draft: NodeCollection) => {
                    draft[id].position = { x: newX, y: newY };
                    draft[id].width = newWidth;
                })
            );
        },
        []
    );

    const onCreateLink = React.useCallback(
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
        [links, nodes]
    );

    const onDeleteSelection = React.useCallback(() => {
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
    }, [selectedItems, nodes, links]);

    const [newNodeId, setNewNodeId] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (newNodeId) {
            taskQueue.propagateNode(newNodeId, nodes, links);
            taskQueue.runAll(nodes, links, setNodes);
            setNewNodeId(undefined);
        }
    }, [newNodeId, nodes, links]);
    const onNodeSelection = React.useCallback(
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
        [panZoomInfo, nodePickerPos, nodesSchemas]
    );

    const onConnectorUpdate = React.useCallback(
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
        [nodes, links]
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

    const onMouseDown = React.useCallback(() => {
        if (nodePickerPos && !nodePickerOnMouseHover) {
            setNodePickerOnMouseHover(false);
            setNodePickerPos(null);
        }
    }, [nodePickerOnMouseHover, nodePickerPos, setNodePickerPos]);

    const onSaveButton = useCallback(() => {
        const data = {
            nodes: nodes,
            links: links
        };

        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
        );
        element.setAttribute("download", "oura-node-editor.json");

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }, [nodes, links]);

    const onLoadButton = useCallback((evt: any) => {
        taskQueue.reset();
        if (evt.target.files.size < 1) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (file) => {
            if (file.target && file.target.result && file.target.result) {
                const data = JSON.parse(atob((file.target.result as string).substring(29)));
                Object.keys(data.nodes).forEach((key) => {
                    data.nodes[key] = createNodeFromJson(data.nodes[key], key, setNodes);
                });
                setNodes(data.nodes);
                setLinks(data.links);
                setRunFirstPropagation(true);
            }
        };
        reader.readAsDataURL(evt.target.files[0]);
    }, []);

    const onResetButton = useCallback(() => {
        taskQueue.reset();
        setNodes({});
        setLinks({});
    }, []);

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
                    onSelectedItems={setSelectedItemsAndMoveSelectedNodeFront}
                    onNodeMove={onNodeMove}
                    onCreateLink={onCreateLink}
                    onConnectorUpdate={onConnectorUpdate}
                    createCustomConnectorComponent={createCustomConnectorsContents}
                />
                {nodePicker}
            </div>
            <button
                onClick={onSaveButton}
                className="input btn-primary input-xs focus:outline-0"
                style={{ position: "absolute", left: 5, bottom: 5 }}
            >
                save
            </button>
            <label
                htmlFor="files"
                className="input btn-primary input-xs focus:outline-0"
                style={{ position: "absolute", left: 55, bottom: 5 }}
            >
                load
            </label>
            <input
                onChange={onLoadButton}
                id="files"
                style={{ visibility: "hidden" }}
                type="file"
            />
            <button
                onClick={onResetButton}
                className="input btn-primary input-xs focus:outline-0"
                style={{ position: "absolute", right: 5, bottom: 5 }}
            >
                reset
            </button>
        </>
    );
};

export default OuraCanvasApp;
