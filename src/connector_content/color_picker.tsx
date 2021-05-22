import React, { Component } from "react";
import produce from "immer";
import { ConnectorContentProps, ConnectorModel, ErrorConnectorComponent } from "oura-node-editor";
import { ChromePicker, ColorResult } from 'react-color';

class ColorPicker extends Component<ConnectorContentProps> {

    constructor(props: ConnectorContentProps) {
        super(props);
        
        this.onColorChange = this.onColorChange.bind(this);
    }

    onColorChange(color: ColorResult) {
        const { nodeId, cId, connector, onConnectorUpdate } = this.props;
        const newConnector = produce(connector, (draft: ConnectorModel) => {
            draft.data.color = `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`;
        });
        onConnectorUpdate(nodeId, cId, newConnector);
    }

    render(): JSX.Element {
        const { connector } = this.props;
        if (!("color" in connector.data)) {
            const message = "'color' connector types must provide a string field named 'color'";
            return <ErrorConnectorComponent message={message} />;
        }
        return (
            <ChromePicker color={connector.data.color} onChange={ this.onColorChange } />
        );
    }
}

export default ColorPicker;
