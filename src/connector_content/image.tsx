import { JSX, useEffect, useRef, useState } from "react";
import { ConnectorContentProps } from "oura-node-editor";

const Image = (props: ConnectorContentProps): JSX.Element => {
    const [src, setSrc] = useState<string>("");
    useEffect(() => {
        if (props.connector.data.src) {
            setSrc(props.connector.data.src);
        }
    }, [props.connector.data]);

    return <img style={{ width: "100%", height: "100%" }} src={src} />;
};

export default Image;
