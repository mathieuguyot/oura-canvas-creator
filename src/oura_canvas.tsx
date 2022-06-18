import React, { useCallback } from "react";
import { produce } from "immer";
import _, { values } from "lodash";

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
import { propagateAll, propagateNode } from "./nodes/node";

let propagationValues: { [id: string]: any } = {};

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
    //TODO parsed each timme.... remove this
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

    const setSelectedItemsAndMoveSelectedNodeFront = useCallback((selection: SelectionItem[]) => {
        if(selection.length === 1 && selection[0].type === "node") {
            setNodes(
                (nodes: NodeCollection) => {
                    const selectedNodeId = selection[0].id;
                    const newNodes: NodeCollection = {};
                    Object.keys(nodes).forEach(key => {
                        if(key !== selectedNodeId) {
                            newNodes[key] = nodes[key];
                        }
                    });
                    newNodes[selectedNodeId] = nodes[selectedNodeId];
                    return newNodes;
            })
        }
        setSelectedItems(selection);
    }, [])

    React.useEffect(() => {
        propagateAll(propagationValues, nodes, links, values);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                propagateAll(propagationValues, nodes, links, setNodes);
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
            const newLinks = produce(links, (draft) => {
                draft[generateUuid()] = link;
            });
            propagateNode(link.inputNodeId, propagationValues, nodes, newLinks, setNodes);
        }, [links, nodes]
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

            const newNodes = produce(nodes, (draft: NodeCollection) => {
                deleteNodeIds.forEach((id) => {
                    delete draft[id];
                });
            });
            const newLinks = produce(links, (draft: LinkCollection) => {
                Object.keys(links).forEach(linkKey => {
                    const link = links[linkKey];
                    if (deleteNodeIds.includes(link.inputNodeId) || deleteNodeIds.includes(link.outputNodeId)) {
                        delete draft[linkKey];
                    }
                });
                deletedLinksIds.forEach((id) => {
                    delete draft[id];
                });
            });
            Object.keys(propagationValues).forEach(key => {
                if(!(key in newLinks)) {
                    delete propagationValues[key];
                }
            })
            propagateAll(propagationValues, newNodes, newLinks, setNodes);
        },
        [selectedItems, nodes, links]
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
                //TODO: propagate on creation
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
            const newNodes = produce(nodes, (draft) => {
                draft[nodeId].connectors[cId] = connector;
            });
            propagateNode(nodeId, propagationValues, newNodes, links, setNodes);
        }, [nodes, links]
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

    const onSaveButton = useCallback(() => {
        const data = {
            "nodes": nodes,
            "links": links
        };

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
        element.setAttribute('download', "oura-node-editor.json");
      
        element.style.display = 'none';
        document.body.appendChild(element);
      
        element.click();
      
        document.body.removeChild(element);
    }, [nodes, links]);

    const onLoadButton = useCallback((evt) => {
        propagationValues = {};
        if(evt.target.files.size < 1) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (file) => {
            if(file.target && file.target.result && file.target.result) {
                const data = JSON.parse(atob((file.target.result as string).substring(29)));
                Object.keys(data.nodes).forEach((key) => {
                    data.nodes[key] = createNodeFromJson(data.nodes[key]);
                });
                setNodes(data.nodes);
                setLinks(data.links);
                propagateAll(propagationValues, data.nodes, data.links, setNodes);
            }
        };
        reader.readAsDataURL(evt.target.files[0]);
    }, []);

    const onResetButton = useCallback(() => {
        propagationValues = {};
        setNodes({});
        setLinks({});
    }, []);

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

    const buttonStyle = {
        font: "bold 11px Arial",
        textDecoration: "none",
        backgroundColor: "#EEEEEE",
        color: "#333333",
        padding: "2px 6px 2px 6px",
        borderTop: "1px solid #CCCCCC",
        borderRight: "1px solid #333333",
        borderBottom: "1px solid #333333",
        borderLeft: "1px solid #CCCCCC"
    };

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
                    customElements={{/*"i": {
                        data: "test",
                        name: "ce1",
                        position: {x: 0, y: 0},
                        type: "comment"
                    }*/}}
                    onPanZoomInfo={setPanZoomInfo}
                    onSelectedItems={setSelectedItemsAndMoveSelectedNodeFront}
                    onNodeMove={onNodeMove}
                    onCreateLink={onCreateLink}
                    onConnectorUpdate={onConnectorUpdate}
                    createCustomConnectorComponent={createCustomConnectorsContents}
                />
                {nodePicker}
            </div>
            <button onClick={onSaveButton} style={{position: "absolute", left: 5, bottom: 5, ...buttonStyle}}>save</button>
            <label htmlFor="files" className="btn" style={{position: "absolute", left: 55, bottom: 5, ...buttonStyle}}>load</label>
            <input onChange={onLoadButton} id="files" style={{visibility: "hidden"}} type="file"/>
            <button onClick={onResetButton} style={{position: "absolute", right: 5, bottom: 5, ...buttonStyle}}>reset</button>
        </>
    );
};

export default OuraCanvasApp;
