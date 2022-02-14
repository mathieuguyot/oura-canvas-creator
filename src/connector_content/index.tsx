import { ConnectorContentProps } from "oura-node-editor";
import Canvas from "./canvas";
import ColorPicker from "./color_picker";
import MySlider from "./slider";

export function createCustomConnectorsContents(props: ConnectorContentProps): JSX.Element | null {
    const { connector } = props;
    if (connector.contentType === "color") {
        return <ColorPicker {...props} />
    }
    if (connector.contentType === "slider") {
        return <MySlider {...props} />
    }
    if (connector.contentType === "canvas") {
        return <Canvas {...props} />
    }
    return null;
}
