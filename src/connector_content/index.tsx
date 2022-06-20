import { ConnectorContentProps } from "oura-node-editor";
import Canvas from "./canvas";

export function createCustomConnectorsContents(props: ConnectorContentProps): JSX.Element | null {
    const { connector } = props;
    if (connector.contentType === "canvas") {
        return <Canvas {...props} />
    }
    return null;
}
