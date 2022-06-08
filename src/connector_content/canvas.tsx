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
        <>
            <div style={{position: "absolute", zIndex: 0.1, backgroundColor: props.connector.data.canvas_color, width: props.connector.data.canvas_width, height: props.connector.data.canvas_height}}></div>
            <canvas style={{position: "relative", imageRendering: "auto"}} width={props.connector.data.canvas_width} height={props.connector.data.canvas_height} ref={canvasRef}/>
        </>
    );
};

export default Canvas;
