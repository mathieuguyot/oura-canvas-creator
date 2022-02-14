import React, { useEffect, useRef } from "react";
import { ConnectorContentProps, ConnectorModel } from "oura-node-editor";
import produce from "immer";

const Canvas = (props : ConnectorContentProps): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const { nodeId, cId, connector, onConnectorUpdate } = props;
        if(canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            const canvas_width = canvasRef.current.width;
            const canvas_height = canvasRef.current.height;
            if(ctx && (!("canvas_ctx" in connector.data) || ctx !== connector.data.canvas_ctx)) {
                const newConnector = produce(connector, (draft: ConnectorModel) => {
                    draft.data.canvas_ctx = ctx;
                    draft.data.canvas_width = canvas_width;
                    draft.data.canvas_height = canvas_height;
                });
                onConnectorUpdate(nodeId, cId, newConnector);
            }
        }
    }, [canvasRef, props]);

    return (
        <canvas width={800} height={600} ref={canvasRef}/>
    );
};

export default Canvas;
