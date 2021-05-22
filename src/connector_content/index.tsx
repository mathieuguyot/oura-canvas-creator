import { ConnectorContentProps } from "oura-node-editor";
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
    return null;
}
