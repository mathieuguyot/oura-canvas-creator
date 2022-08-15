import { ConnectorContentProps } from "oura-node-editor";
import Canvas from "./canvas";
import ThreeJs from "./threejs";

export function createCustomConnectorsContents(props: ConnectorContentProps): JSX.Element | null {
    const { connector } = props;
    if (connector.contentType === "canvas") {
        return <Canvas {...props} />
    }
    if (connector.contentType === "threejs") {
        return <ThreeJs {...props} />
    }
    return null;
}
