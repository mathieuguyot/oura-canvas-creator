import { JSX, useCallback, useState, useMemo, useRef, useEffect } from "react";
import { NodeEditor, XYPosition, AddNodeContextualMenu, useNodeEditor } from "oura-node-editor";
import { ExecutionEngine, createRunners } from "./engine";
import { createCustomConnectorsContents } from "../connector_content";
import BottomActions from "../bottom_actions";

const STORAGE_KEY = "oura_canvas_state";

const OuraCanvasApp = (): JSX.Element => {
    const { panZoomInfo, selectedItems, setPanZoomInfo, setSelectedItems } = useNodeEditor();

    // Create engine as state to support hot reload
    const runners = useMemo(() => createRunners(), []);
    const [engine] = useState(() => new ExecutionEngine(runners));

    const [nodePickerPos, setNodePickerPos] = useState<XYPosition | null>(null);
    const [nodePickerOnMouseHover, setNodePickerOnMouseHover] = useState<boolean>(false);
    const [nodes, setNodes] = useState(() => engine.getNodes());
    const [links, setLinks] = useState(() => engine.getLinks());

    const isProcessingRef = useRef(false);

    // Subscribe to engine updates
    useEffect(() => {
        const updateState = () => {
            setNodes(engine.getNodes());
            setLinks(engine.getLinks());
        };

        engine.subscribe(updateState);
        return () => engine.unsubscribe(updateState);
    }, [engine]);

    const closeNodePicker = useCallback(() => {
        setNodePickerOnMouseHover(false);
        setNodePickerPos(null);
    }, []);

    const onContextMenu = useCallback(
        (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            event.preventDefault();
            event.stopPropagation();

            if (!nodePickerPos) {
                setNodePickerPos({ x: event.pageX, y: event.pageY });
            } else {
                closeNodePicker();
            }
        },
        [nodePickerPos, closeNodePicker]
    );

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (nodePickerPos && !nodePickerOnMouseHover) {
                closeNodePicker();
                e.stopPropagation();
            }
        },
        [nodePickerOnMouseHover, nodePickerPos, closeNodePicker]
    );

    const onNodeSelection = useCallback(
        (type: string) => {
            if (!nodePickerPos || isProcessingRef.current) return;

            const runner = runners[type];
            if (!runner) {
                console.error(`Runner type "${type}" not found`);
                return;
            }

            try {
                isProcessingRef.current = true;

                const newX =
                    -panZoomInfo.topLeftCorner.x / panZoomInfo.zoom +
                    nodePickerPos.x / panZoomInfo.zoom;
                const newY =
                    -panZoomInfo.topLeftCorner.y / panZoomInfo.zoom +
                    nodePickerPos.y / panZoomInfo.zoom;

                const node = {
                    ...runner,
                    position: { x: newX, y: newY }
                };

                engine.addNode(node);
                closeNodePicker();
            } catch (error) {
                console.error("Error adding node:", error);
            } finally {
                isProcessingRef.current = false;
            }
        },
        [nodePickerPos, panZoomInfo, runners, engine, closeNodePicker]
    );

    const onNodeMove = useCallback(
        (id: string, x: number, y: number, w: number) => {
            if (isProcessingRef.current) return;

            try {
                isProcessingRef.current = true;
                engine.onNodeMove(id, x, y, w);
            } catch (error) {
                console.error("Error moving node:", error);
            } finally {
                isProcessingRef.current = false;
            }
        },
        [engine]
    );

    const onCreateLink = useCallback(
        (link: any) => {
            if (isProcessingRef.current) return;

            try {
                isProcessingRef.current = true;
                engine.addLink(link);
            } catch (error) {
                console.error("Error creating link:", error);
            } finally {
                isProcessingRef.current = false;
            }
        },
        [engine]
    );

    const onConnectorUpdate = useCallback(
        (nodeId: string, cId: string, connector: any) => {
            if (isProcessingRef.current) return;

            try {
                isProcessingRef.current = true;
                engine.updateConnector(nodeId, cId, connector);
            } catch (error) {
                console.error("Error updating connector:", error);
            } finally {
                isProcessingRef.current = false;
            }
        },
        [engine]
    );

    const onDelete = useCallback(() => {
        if (isProcessingRef.current || !selectedItems || selectedItems.length === 0) return;

        try {
            isProcessingRef.current = true;

            // Separate nodes and links from selectedItems
            const nodesToDelete: string[] = [];
            const linksToDelete: string[] = [];

            selectedItems.forEach((item) => {
                if (item.type === "node") {
                    nodesToDelete.push(item.id);
                } else if (item.type === "link") {
                    linksToDelete.push(item.id);
                }
            });

            // Delete nodes
            nodesToDelete.forEach((nodeId) => {
                engine.deleteNode(nodeId);
            });

            // Delete links
            linksToDelete.forEach((linkId) => {
                engine.deleteLink(linkId);
            });

            // Clear selection
            setSelectedItems([]);
        } catch (error) {
            console.error("Error deleting items:", error);
        } finally {
            isProcessingRef.current = false;
        }
    }, [engine, selectedItems, setSelectedItems]);

    const onReset = useCallback(() => {
        if (isProcessingRef.current) return;

        const confirmed = window.confirm(
            "Are you sure you want to reset the canvas? This will delete all nodes and links."
        );

        if (!confirmed) return;

        try {
            isProcessingRef.current = true;
            engine.clear();
            setSelectedItems([]);
            setPanZoomInfo({
                topLeftCorner: { x: 0, y: 0 },
                zoom: 1
            });
        } catch (error) {
            console.error("Error resetting canvas:", error);
        } finally {
            isProcessingRef.current = false;
        }
    }, [engine, setSelectedItems, setPanZoomInfo]);

    const onSave = useCallback(() => {
        if (isProcessingRef.current) return;

        try {
            const state = engine.getState();
            const dataToSave = {
                ...state,
                panZoomInfo,
                timestamp: Date.now()
            };

            const json = JSON.stringify(dataToSave, null, 2);

            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, json);

            // Also create a downloadable file
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `oura_canvas_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert("Canvas saved successfully!");
        } catch (error) {
            console.error("Error saving canvas:", error);
            alert("Failed to save canvas. Check console for details.");
        }
    }, [engine, panZoomInfo]);

    const onLoad = useCallback(() => {
        if (isProcessingRef.current) return;

        const loadFromData = (data: any) => {
            try {
                isProcessingRef.current = true;

                if (!data.nodes || !data.links) {
                    throw new Error("Invalid save file format");
                }

                engine.setState({
                    nodes: data.nodes,
                    links: data.links
                });

                if (data.panZoomInfo) {
                    setPanZoomInfo(data.panZoomInfo);
                }

                setSelectedItems([]);
                alert("Canvas loaded successfully!");
            } catch (error) {
                console.error("Error loading canvas:", error);
                alert("Failed to load canvas. Check console for details.");
            } finally {
                isProcessingRef.current = false;
            }
        };

        // Try loading from localStorage first
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const useLocalStorage = window.confirm(
                "Found saved canvas in browser. Load it? (Cancel to load from file)"
            );

            if (useLocalStorage) {
                try {
                    const data = JSON.parse(savedState);
                    loadFromData(data);
                    return;
                } catch (error) {
                    console.error("Error parsing saved state:", error);
                }
            }
        }

        // Load from file
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    loadFromData(data);
                } catch (error) {
                    console.error("Error parsing file:", error);
                    alert("Invalid file format");
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }, [engine, setPanZoomInfo, setSelectedItems]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete key or Backspace
            if ((e.key === "Delete" || e.key === "Backspace") && !e.repeat) {
                const target = e.target as HTMLElement;
                // Don't delete if user is typing in an input
                if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                    e.preventDefault();
                    onDelete();
                }
            }

            // Ctrl+S or Cmd+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                onSave();
            }

            // Ctrl+O or Cmd+O to load
            if ((e.ctrlKey || e.metaKey) && e.key === "o") {
                e.preventDefault();
                onLoad();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onDelete, onSave, onLoad]);

    return (
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
            {nodePickerPos && (
                <div
                    style={{
                        width: 640,
                        height: 500,
                        position: "absolute",
                        top: nodePickerPos.y,
                        left: nodePickerPos.x,
                        backgroundColor: "white",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        borderRadius: "4px",
                        zIndex: 1000
                    }}
                >
                    <AddNodeContextualMenu
                        nodesSchema={runners}
                        onNodeSelection={onNodeSelection}
                        onMouseHover={setNodePickerOnMouseHover}
                        createCustomConnectorComponent={createCustomConnectorsContents}
                    />
                </div>
            )}
            <BottomActions
                selectedItems={selectedItems}
                onDelete={onDelete}
                onReset={onReset}
                onLoad={onLoad}
                onSave={onSave}
            />
        </div>
    );
};

export default OuraCanvasApp;
