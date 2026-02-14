import { JSX, useCallback } from "react";
import { ConnectorContentProps, ConnectorModel } from "oura-node-editor";
import Editor from "@monaco-editor/react";
import { produce } from "immer";

const Monaco = ({
    connector,
    nodeId,
    cId,
    onConnectorUpdate
}: ConnectorContentProps): JSX.Element => {
    const onchange = useCallback(
        (value: string | undefined) => {
            const newConnector = produce(connector, (draft: ConnectorModel) => {
                draft.data.value = value;
            });
            onConnectorUpdate(nodeId, cId, newConnector);
        },
        [cId, connector, nodeId, onConnectorUpdate]
    );

    return (
        <Editor
            height="400px"
            defaultLanguage="javascript"
            defaultValue={connector.data.value || ""}
            language={connector.data.language || "python"}
            onChange={onchange}
        />
    );
};

export default Monaco;
