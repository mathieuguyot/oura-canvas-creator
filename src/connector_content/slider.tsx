import React, { Component } from "react";
import { ConnectorContentProps } from "oura-node-editor";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

class MySlider extends Component<ConnectorContentProps> {
    render(): JSX.Element {
        return (
            <>
                ICI
                <Slider onChange={value => {console.log(value)}} />
            </>
        );
    }
}

export default MySlider;
