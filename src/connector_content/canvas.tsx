import React, { useEffect, useRef } from "react";
import { ConnectorContentProps, ConnectorModel } from "oura-node-editor";
import produce from "immer";

const Canvas = (props : ConnectorContentProps): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const { nodeId, cId, connector, onConnectorUpdate } = props;
        if(canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if(ctx && (!("canvas_ctx" in connector.data) || ctx !== connector.data.canvas_ctx)) {
                const newConnector = produce(connector, (draft: ConnectorModel) => {
                    draft.data.canvas_ctx = ctx;
                });
                onConnectorUpdate(nodeId, cId, newConnector);
            }
        }
    }, [canvasRef, props]);

    return (
        <canvas style={{border: "1px solid black"}} width={props.connector.data.canvas_width} height={props.connector.data.canvas_height} ref={canvasRef}/>
    );
};

export default Canvas;
