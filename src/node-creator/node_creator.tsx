import { useCallback, useState } from "react";
import Editor from "@monaco-editor/react";
import { ConnectorCollection, ConnectorModel, generateUuid, PinLayout } from "oura-node-editor";
import produce from "immer";
import { UserNode } from "../nodes/node";

function booleanToPinLayout(left: boolean, right: boolean) : PinLayout {
    if(left && right) return PinLayout.BOTH_PINS;
    if(!left && !right) return PinLayout.NO_PINS;
    if(left && !right) return PinLayout.LEFT_PIN;
    return PinLayout.RIGHT_PIN;
}

type ConnectorCreatorItemProps = {
    connector: ConnectorModel;
    setConnector: (connector: ConnectorModel) => void;
    removeConnector: () => void;
}

const ConnectorCreatorItem = ({ connector, setConnector, removeConnector }: ConnectorCreatorItemProps): JSX.Element => {
    const leftPin = connector.pinLayout === PinLayout.LEFT_PIN || connector.pinLayout === PinLayout.BOTH_PINS;
    const rightPin = connector.pinLayout === PinLayout.RIGHT_PIN || connector.pinLayout === PinLayout.BOTH_PINS;
    
    const setConnectorType = useCallback((t: string) => {
        const data: any = {};
        if(t === "number") {
            data["value"] = 0;
        }
        if(t === "string") {
            data["value"] = "";
        }
        if(t === "check_box") {
            data["value"] = false;
        }
        setConnector({...connector, contentType: t, data: data});
    }, [setConnector, connector]);
    
    return <div>
        <input value={connector.name} onChange={e => setConnector({ ...connector, name: e.target.value })} />
        <input
            checked={leftPin}
            onChange={() => setConnector({...connector, pinLayout: booleanToPinLayout(!leftPin, rightPin)})}
            type="checkbox"
        />
        <input
            checked={rightPin}
            onChange={() => setConnector({...connector, pinLayout: booleanToPinLayout(leftPin, !rightPin)})}
            type="checkbox"
        />
        <select value={connector.contentType} onChange={e => setConnectorType(e.target.value)}>
            <option value="none">none</option>
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="check_box">boolean</option>
            <option value="select">select</option>
            <option value="button">button</option>
            <option value="canvas">canvas</option>
        </select>
        <button onClick={removeConnector}>remove</button>
    </div>
}

type NodeCreatorItemProps = {
    node: UserNode;
    setNode: (node: UserNode) => void;
}

const NodeCreatorItem = ({ node, setNode }: NodeCreatorItemProps): JSX.Element => {

    const addConnector = useCallback(() => {
        setNode(produce(node, draft => {
            draft.connectors[Object.keys(node.connectors).length] = {
                name: "connector",
                contentType: "none",
                pinLayout: PinLayout.NO_PINS,
                data: { value: "" }
            } as ConnectorModel;
        }));
    }, [setNode, node]);

    const removeConnector = useCallback((key: string) => {
        let size = 0;
        const newConnectors: ConnectorCollection = {};
        Object.keys(node.connectors).forEach((currentkey) => {
            if(key !== currentkey) {
                newConnectors[size] = node.connectors[currentkey];
            }
        });
        setNode(produce(node, draft => {
            draft.connectors = newConnectors;
        }));
    }, [setNode, node]);

    const setConnector = useCallback((key: string, connector: ConnectorModel) => {
        setNode(produce(node, draft => {
            draft.connectors[key] = connector;
        }));
    }, [setNode, node]);

    return (<div>
        <input value={node.name} onChange={e => setNode({...node, name: e.target.value} as UserNode)} />
        <br />
        {Object.keys(node.connectors).map(key => <ConnectorCreatorItem key={key} connector={node.connectors[key]} setConnector={(connector) => setConnector(key, connector)} removeConnector={() => removeConnector(key)} />)}
        <button onClick={addConnector}>Add node param</button>
        <Editor
            height="90vh"
            defaultLanguage="javascript"
            value={node.code}
            onChange={e => setNode({...node, code: e ? e : ""} as UserNode)}
        />
    </div>);
};

type NodeCreatorProps = {
    nodes: {[key: string]: UserNode};
    setNodes: (nodes: {[key: string]: UserNode}) => void;
}

const NodeCreator = ({ nodes, setNodes }: NodeCreatorProps): JSX.Element => {
    const [selectedNodeKey, setSelectedNodeKey] = useState<undefined | string>(undefined);

    const onUpdateNode = useCallback((key: string, node: UserNode) => {
        setNodes(
            produce(nodes, draft => {
                draft[key] = node;
            })
        );
    }, [nodes, setNodes]);

    const onCreateNode = useCallback(() => {
        setNodes(
            produce(nodes, draft => {
                draft[generateUuid()] = new UserNode("my-node", 100, {x: 0, y: 0}, {});
            })
        );
    }, [nodes, setNodes]);

    const ondeleteNode = useCallback(() => {
        setSelectedNodeKey(undefined);
        setNodes(
            produce(nodes, draft => {
                if(selectedNodeKey) delete draft[selectedNodeKey];
            })
        );
    }, [nodes, setNodes, selectedNodeKey]);
 

    return <div style={{ width: "40%", height: "100%", position: "absolute", right: 0, backgroundColor: "grey", zIndex: 1 }}>
        <select value={selectedNodeKey} onChange={e => setSelectedNodeKey(e.target.value)}>
            <option value={undefined}></option>
            {Object.keys(nodes).map((key) => <option key={key} value={key}>{nodes[key].name}</option>)}
        </select>
        <button onClick={onCreateNode}>create</button>
        {selectedNodeKey && <button onClick={ondeleteNode}>delete</button>}
        {selectedNodeKey && <NodeCreatorItem node={nodes[selectedNodeKey]} setNode={(node) => onUpdateNode(selectedNodeKey, node)}/>}
    </div>
}

export default NodeCreator;
