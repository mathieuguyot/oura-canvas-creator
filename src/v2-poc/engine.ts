import {
    ConnectorCollection,
    ConnectorModel,
    generateUuid,
    LinkCollection,
    LinkModel,
    NodeCollection,
    NodeModel,
    PinLayout
} from "oura-node-editor";

export type Params = { [id: string]: any };

export interface NodeRunner extends NodeModel {
    type: string;
    execute: (
        inputs: Params,
        connectors: ConnectorCollection
    ) => { outputs: Params; newConnectors: ConnectorCollection | null };
}

export type NodeRunnerCollection = { [id: string]: NodeRunner };
type Subscriber = () => void;

// Helper function to update connector data
function updateConnectorData(
    connectors: ConnectorCollection,
    connectorId: string,
    dataUpdates: Partial<any>,
    preserveOtherFields: boolean = true
): ConnectorCollection {
    const connector = connectors[connectorId];
    if (!connector) return connectors;

    return {
        ...connectors,
        [connectorId]: {
            ...connector,
            data: preserveOtherFields ? { ...connector.data, ...dataUpdates } : dataUpdates
        }
    };
}

// Helper to update multiple connectors at once
function updateConnectors(
    connectors: ConnectorCollection,
    updates: { [connectorId: string]: Partial<any> }
): ConnectorCollection {
    let result = { ...connectors };
    for (const [id, dataUpdates] of Object.entries(updates)) {
        result = updateConnectorData(result, id, dataUpdates);
    }
    return result;
}

function getOutputLinks(nodeId: string, links: LinkCollection): LinkCollection {
    const linkOutputs: LinkCollection = {};
    for (const linkKey in links) {
        if (links[linkKey]?.rightNodeId === nodeId) {
            linkOutputs[linkKey] = links[linkKey];
        }
    }
    return linkOutputs;
}

function getInputsLinks(nodeId: string, links: LinkCollection): LinkCollection {
    const linkOutputs: LinkCollection = {};
    for (const linkKey in links) {
        if (links[linkKey]?.leftNodeId === nodeId) {
            linkOutputs[linkKey] = links[linkKey];
        }
    }
    return linkOutputs;
}

function propagationDictToOrderedList(propagationDict: { [id: string]: number }): string[] {
    return Object.entries(propagationDict)
        .sort((a, b) => a[1] - b[1])
        .map(([nodeId]) => nodeId);
}

function createPropagationTree(
    nodeId: string,
    links: LinkCollection,
    depth: number,
    propagationDict: { [id: string]: number },
    visited: Set<string> = new Set()
): void {
    // Prevent infinite loops in cyclic graphs
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    propagationDict[nodeId] =
        nodeId in propagationDict ? Math.max(depth, propagationDict[nodeId]) : depth;

    const outputLinks = getOutputLinks(nodeId, links);
    for (const linkKey in outputLinks) {
        const link = links[linkKey];
        if (link) {
            createPropagationTree(link.leftNodeId, links, depth + 1, propagationDict, visited);
        }
    }
}

export class ExecutionEngine {
    protected runners: NodeRunnerCollection;
    protected nodes: NodeCollection;
    protected links: LinkCollection;
    protected tasks: string[] = [];
    protected propagationValues: { [linkId: string]: any } = {};
    protected subscribers: Set<Subscriber> = new Set();
    protected isExecuting: boolean = false;
    protected maxIterations: number = 10000;

    constructor(runners: NodeRunnerCollection) {
        this.runners = runners;
        this.nodes = {};
        this.links = {};
    }

    subscribe(callback: Subscriber): void {
        this.subscribers.add(callback);
    }

    unsubscribe(callback: Subscriber): void {
        this.subscribers.delete(callback);
    }

    protected notify(): void {
        this.subscribers.forEach((callback) => {
            try {
                callback();
            } catch (error) {
                console.error("Subscriber error:", error);
            }
        });
    }

    getNodes(): NodeCollection {
        return { ...this.nodes };
    }

    getLinks(): LinkCollection {
        return { ...this.links };
    }

    addNode(node: NodeModel): void {
        if (!node) {
            console.error("Cannot add null/undefined node");
            return;
        }

        const uuid = generateUuid();

        this.nodes = { ...this.nodes, [uuid]: {...node} };
        this.propagateNode(uuid);
        this.runAll();
        this.notify();
    }

    addLink(link: LinkModel): void {
        if (!link || !link.leftNodeId || !link.rightNodeId) {
            console.error("Invalid link:", link);
            return;
        }

        // Validate that nodes exist
        if (!this.nodes[link.leftNodeId] || !this.nodes[link.rightNodeId]) {
            console.error("Cannot create link: one or both nodes don't exist");
            return;
        }

        this.links = { ...this.links, [generateUuid()]: { ...link } };
        this.propagateAll();
        this.runAll();
        this.notify();
    }

    updateConnector(nodeId: string, connectorId: string, connector: ConnectorModel): void {
        const node = this.nodes[nodeId];
        if (!node) {
            console.error(`Node ${nodeId} not found`);
            return;
        }

        if (!node.connectors[connectorId]) {
            console.error(`Connector ${connectorId} not found on node ${nodeId}`);
            return;
        }

        this.nodes = {
            ...this.nodes,
            [nodeId]: {
                ...node,
                connectors: {
                    ...node.connectors,
                    [connectorId]: { ...connector }
                }
            }
        };
        this.propagateNode(nodeId);
        this.runAll();
        this.notify();
    }

    onNodeMove(nodeId: string, x: number, y: number, newWidth: number): void {
        const node = this.nodes[nodeId];
        if (!node) {
            console.error(`Node ${nodeId} not found`);
            return;
        }

        this.nodes = {
            ...this.nodes,
            [nodeId]: {
                ...node,
                position: { x, y },
                width: newWidth
            }
        };
        this.notify();
    }

    deleteNode(nodeId: string): void {
        if (!this.nodes[nodeId]) {
            console.error(`Node ${nodeId} not found`);
            return;
        }

        // Remove all links connected to this node
        const newLinks: LinkCollection = {};
        for (const linkId in this.links) {
            const link = this.links[linkId];
            if (link.leftNodeId !== nodeId && link.rightNodeId !== nodeId) {
                newLinks[linkId] = link;
            }
        }
        this.links = newLinks;

        // Remove the node
        const newNodes = { ...this.nodes };
        delete newNodes[nodeId];
        this.nodes = newNodes;

        this.propagateAll();
        this.runAll();
        this.notify();
    }

    deleteLink(linkId: string): void {
        if (!this.links[linkId]) {
            console.error(`Link ${linkId} not found`);
            return;
        }

        const newLinks = { ...this.links };
        delete newLinks[linkId];
        this.links = newLinks;

        this.propagateAll();
        this.runAll();
        this.notify();
    }

    protected propagateAll(): void {
        this.tasks = [];
        const propagationDict: { [id: string]: number } = {};

        for (const nodeId in this.nodes) {
            createPropagationTree(nodeId, this.links, 0, propagationDict);
        }

        const propagationList = propagationDictToOrderedList(propagationDict);

        // Remove duplicates while preserving order
        const uniqueTasks = [...new Set(propagationList)];
        this.tasks.push(...uniqueTasks);
    }

    protected propagateNode(nodeId: string): void {
        if (!this.nodes[nodeId]) {
            console.error(`Cannot propagate: node ${nodeId} not found`);
            return;
        }

        const propagationDict: { [id: string]: number } = {};
        createPropagationTree(nodeId, this.links, 0, propagationDict);
        const propagationList = propagationDictToOrderedList(propagationDict);

        // Remove duplicates
        const uniqueTasks = [...new Set(propagationList)];
        this.tasks.push(...uniqueTasks);
    }

    protected runAll(): void {
        if (this.isExecuting) {
            console.warn("Already executing, skipping runAll");
            return;
        }

        this.isExecuting = true;
        let iterations = 0;

        try {
            while (this.tasks.length > 0 && iterations < this.maxIterations) {
                this.runTask();
                iterations++;
            }

            if (iterations >= this.maxIterations) {
                console.error("Max iterations reached, possible infinite loop detected");
                this.tasks = [];
            }
        } catch (error) {
            console.error("Error during execution:", error);
            this.tasks = [];
        } finally {
            this.isExecuting = false;
        }
    }

    protected runTask(): void {
        if (this.tasks.length === 0) return;

        const propagingNodeId = this.tasks[0];
        const node = this.nodes[propagingNodeId];

        if (!node) {
            this.tasks.shift();
            return;
        }

        const runner = this.runners[node.name];
        if (!runner) {
            console.warn(`Runner for node type "${node.name}" not found`);
            this.tasks.shift();
            return;
        }

        try {
            const inputLinks = getInputsLinks(propagingNodeId, this.links);
            const inputValues: Params = {};

            for (const linkId in inputLinks) {
                if (!(linkId in this.propagationValues)) continue;

                const link = this.links[linkId];
                if (!link) continue;

                const pinId = link.leftNodeConnectorId;
                const connector = node.connectors[pinId];

                if (!connector) continue;

                if (connector.isMultiInputAllowed) {
                    if (!(pinId in inputValues)) {
                        inputValues[pinId] = [];
                    }
                    inputValues[pinId].push(this.propagationValues[linkId]);
                } else {
                    inputValues[pinId] = this.propagationValues[linkId];
                }
            }

            const result = runner.execute(inputValues, node.connectors);

            if (!result || typeof result !== "object") {
                console.error(`Invalid result from runner "${node.name}"`);
                this.tasks.shift();
                return;
            }

            const outputLinks = getOutputLinks(propagingNodeId, this.links);
            for (const linkId in outputLinks) {
                const link = this.links[linkId];
                if (link && result.outputs) {
                    this.propagationValues[linkId] = result.outputs[link.rightNodeConnectorId];
                }
            }

            if (result.newConnectors) {
                this.nodes = {
                    ...this.nodes,
                    [propagingNodeId]: {
                        ...node,
                        connectors: result.newConnectors
                    }
                };
            }
        } catch (error) {
            console.error(`Error executing node "${node.name}":`, error);
        }

        this.tasks.shift();
    }

    clear(): void {
        this.nodes = {};
        this.links = {};
        this.tasks = [];
        this.propagationValues = {};
        this.notify();
    }

    getState(): { nodes: NodeCollection; links: LinkCollection } {
        return {
            nodes: this.getNodes(),
            links: this.getLinks()
        };
    }

    setState(state: { nodes: NodeCollection; links: LinkCollection }): void {
        if (!state || typeof state !== "object") {
            console.error("Invalid state");
            return;
        }

        this.nodes = state.nodes ? { ...state.nodes } : {};
        this.links = state.links ? { ...state.links } : {};
        this.propagateAll();
        this.runAll();
        this.notify();
    }
}

class NodeRunnerBuilder {
    private node: Partial<NodeRunner>;
    private connectorIndex: number = 0;

    constructor(type: string, name?: string) {
        this.node = {
            type,
            name: name || type,
            position: { x: 0, y: 0 },
            width: 200,
            connectors: {}
        };
    }

    setWidth(width: number): this {
        this.node.width = width;
        return this;
    }

    setPosition(x: number, y: number): this {
        this.node.position = { x, y };
        return this;
    }

    addConnector(
        pinLayout: PinLayout,
        contentType: string,
        name: string,
        data: any,
        options?: {
            isMultiInputAllowed?: boolean;
            leftPinColor?: string;
        }
    ): this {
        const id = this.connectorIndex.toString();
        this.node.connectors![id] = {
            pinLayout,
            contentType,
            name,
            data,
            isMultiInputAllowed: options?.isMultiInputAllowed ?? false,
            ...(options?.leftPinColor && { leftPinColor: options.leftPinColor })
        };
        this.connectorIndex++;
        return this;
    }

    // Convenience methods for common connector types
    addOutputPin(name: string, contentType: string = "none", data: any = {}): this {
        return this.addConnector(PinLayout.RIGHT_PIN, contentType, name, data);
    }

    addButton(name: string, onClick: (connectors: ConnectorCollection) => ConnectorCollection | null) : this {
        return this.addConnector(PinLayout.NO_PINS, "button", name, {
            label: name,
            onClick: onClick,
        })
    }

    addNumberInput(name: string, defaultValue: number = 0): this {
        return this.addConnector(PinLayout.LEFT_PIN, "number", name, {
            value: defaultValue,
            disabled: false
        });
    }

    addColorInput(name: string, defaultValue: string = "black"): this {
        return this.addConnector(
            PinLayout.LEFT_PIN,
            "none",
            name,
            {
                value: defaultValue
            },
            { leftPinColor: "orange" }
        );
    }

    addSelectInput(name: string, values: string[], selectedIndex: number = 0): this {
        return this.addConnector(PinLayout.NO_PINS, "select", name, {
            values,
            selected_index: selectedIndex
        });
    }

    addCanvasInput(
        name: string,
        width: number = 300,
        height: number = 300,
        color: string = "white",
        multiInput: boolean = false
    ): this {
        return this.addConnector(
            PinLayout.LEFT_PIN,
            "canvas",
            name,
            {
                canvas_width: width,
                canvas_height: height,
                canvas_color: color,
                canvas_draw: null
            },
            { isMultiInputAllowed: multiInput }
        );
    }

    setExecute(executeFn: (inputs: any, connectors: ConnectorCollection) => any): this {
        this.node.execute = executeFn;
        return this;
    }

    build(): NodeRunner {
        if (!this.node.execute) {
            throw new Error("Execute function must be set before building");
        }
        return this.node as NodeRunner;
    }
}

// Helper function to get input value with fallback to connector default
function getInputValue(inputs: any, connectors: any, id: string, defaultValue?: any): any {
    if (id in inputs) {
        return inputs[id];
    }
    return connectors[id]?.data?.value ?? defaultValue;
}

const numberNodeRunner = new NodeRunnerBuilder("number")
    .setWidth(100)
    .addOutputPin("output", "number", { value: 0 })
    .setExecute((_, connectors) => {
        try {
            const value = Number(connectors["0"]?.data?.value ?? 0);
            return { outputs: { "0": value }, newConnectors: null };
        } catch (error) {
            console.error("Error in number node:", error);
            return { outputs: { "0": 0 }, newConnectors: null };
        }
    })
    .build();

const addNodeRunner = new NodeRunnerBuilder("addition")
    .setWidth(100)
    .addConnector(PinLayout.RIGHT_PIN, "number", "res", { value: 0, disabled: true })
    .addNumberInput("a", 0)
    .addNumberInput("b", 0)
    .setExecute((inputs, connectors) => {
        try {
            const hasAInput = "1" in inputs;
            const hasBInput = "2" in inputs;

            const a = hasAInput ? inputs["1"] : (connectors["1"]?.data?.value ?? 0);
            const b = hasBInput ? inputs["2"] : (connectors["2"]?.data?.value ?? 0);
            const sum = Number(a) + Number(b);

            const newConnectors = updateConnectors(connectors, {
                "0": { value: sum, disabled: true },
                "1": { value: a, disabled: hasAInput },
                "2": { value: b, disabled: hasBInput }
            });

            return { outputs: { "0": sum }, newConnectors };
        } catch (error) {
            console.error("Error in addition node:", error);
            return { outputs: { "0": 0 }, newConnectors: null };
        }
    })
    .build();

const rectangleNodeRunner = new NodeRunnerBuilder("rectangle")
    .addOutputPin("draw")
    .addNumberInput("x", 0)
    .addNumberInput("y", 0)
    .addNumberInput("width", 100)
    .addNumberInput("height", 100)
    .addColorInput("color", "black")
    .addSelectInput("type", ["fill", "stroke", "clear"], 0)
    .addNumberInput("line width", 1)
    .setExecute((inputs, connectors) => {
        const x = Number(getInputValue(inputs, connectors, "1", 0));
        const y = Number(getInputValue(inputs, connectors, "2", 0));
        const width = Number(getInputValue(inputs, connectors, "3", 100));
        const height = Number(getInputValue(inputs, connectors, "4", 100));
        const color = getInputValue(inputs, connectors, "5", "black");
        const lineWidth = Number(getInputValue(inputs, connectors, "7", 1));
        const type = connectors["6"]?.data?.selected_index ?? 0;

        const newConnectors = updateConnectors(connectors, {
            "1": { value: x, disabled: "1" in inputs },
            "2": { value: y, disabled: "2" in inputs },
            "3": { value: width, disabled: "3" in inputs },
            "4": { value: height, disabled: "4" in inputs },
            "7": { value: lineWidth, disabled: "7" in inputs }
        });

        const draw = (ctx: CanvasRenderingContext2D): void => {
            if (type === 0) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, width, height);
                ctx.fillStyle = "black";
            } else if (type === 1) {
                ctx.strokeStyle = color;
                const oldLineWidth = ctx.lineWidth;
                ctx.lineWidth = lineWidth;
                ctx.strokeRect(x, y, width, height);
                ctx.lineWidth = oldLineWidth;
                ctx.strokeStyle = "black";
            } else if (type === 2) {
                ctx.clearRect(x, y, width, height);
            }
        };

        return { outputs: { "0": draw }, newConnectors };
    })
    .build();

// Example usage - recreating the canvas node
const canvasNodeRunner = new NodeRunnerBuilder("canvas")
    .setWidth(330)
    .addCanvasInput("draw", 300, 300, "white", true)
    .addNumberInput("width", 300)
    .addNumberInput("height", 300)
    .addColorInput("color", "white")
    .setExecute((inputs, connectors) => {
        const width = Number(getInputValue(inputs, connectors, "1", 300));
        const height = Number(getInputValue(inputs, connectors, "2", 300));
        const color = getInputValue(inputs, connectors, "3", "white");

        const draw = (ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "black";

            if (inputs["0"]) {
                const drawInputs = Array.isArray(inputs["0"]) ? inputs["0"] : [inputs["0"]];
                drawInputs.forEach((drawFunc: any) => {
                    try {
                        if (typeof drawFunc === "function") {
                            drawFunc(ctx);
                        } else if (Array.isArray(drawFunc)) {
                            drawFunc.forEach((fn) => {
                                if (typeof fn === "function") fn(ctx);
                            });
                        }
                    } catch (err) {
                        console.error("Error executing draw function:", err);
                    }
                });
            }
        };

        const newConnectors = updateConnectors(connectors, {
            "0": {
                canvas_width: width,
                canvas_height: height,
                canvas_color: color,
                canvas_draw: draw
            },
            "1": { value: width, disabled: "1" in inputs },
            "2": { value: height, disabled: "2" in inputs }
        });

        return { outputs: {}, newConnectors };
    })
    .build();

const testNodeRunner = new NodeRunnerBuilder("test")
    .setWidth(300)
    .addConnector(PinLayout.RIGHT_PIN, "number", "click count", {value: 0, disabled: true})
    .addButton("test", (connectors: ConnectorCollection) => {
        return updateConnectorData(connectors, "0", {value: connectors["0"].data.value + 1});
    })
    .setExecute((_, connectors) => { return { outputs: { "0": connectors["0"].data.value }, newConnectors: null };})
    .build()

export function createRunners(): NodeRunnerCollection {
    return {
        number: numberNodeRunner,
        addition: addNodeRunner,
        rectangle: rectangleNodeRunner,
        canvas: canvasNodeRunner,
        test: testNodeRunner
    };
}
