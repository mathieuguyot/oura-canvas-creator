import { JSX } from "react";
import { ConnectorContentProps } from "oura-node-editor";
import Canvas from "./canvas";
import ThreeJs from "./threejs";
import Image from "./image";
import Monaco from "./monaco";

export function createCustomConnectorsContents(props: ConnectorContentProps): JSX.Element | null {
    const { connector } = props;
    if (connector.contentType === "canvas") {
        return <Canvas {...props} />;
    }
    if (connector.contentType === "threejs") {
        return <ThreeJs {...props} />;
    }
    if (connector.contentType === "image") {
        return <Image {...props} />;
    }
    if (connector.contentType === "monaco") {
        return <Monaco {...props} />;
    }
    return null;
}
