import { useEffect, useRef } from "react";
import { ConnectorContentProps } from "oura-node-editor";

const Canvas = (props : ConnectorContentProps): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if(ctx && props.connector.data.canvas_draw) {
                props.connector.data.canvas_draw(ctx);
            }
        }
    }, [canvasRef, props.connector.data]);

    return (
        <>
            <div style={{position: "absolute", zIndex: 0.1, backgroundColor: props.connector.data.canvas_color, width: props.connector.data.canvas_width, height: props.connector.data.canvas_height}}></div>
            <canvas style={{position: "relative", imageRendering: "auto"}} width={props.connector.data.canvas_width} height={props.connector.data.canvas_height} ref={canvasRef} />
        </>
    );
};

export default Canvas;
