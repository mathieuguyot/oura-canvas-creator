/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";

export default class ColorNode extends Node {
    constructor() {
        super("color", 250, {
            0: {
                name: "color",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "color",
                data: { color: "#fff" }
            },
            1: {
                name: "slider",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "slider",
                data: {  }
            }
        });
    }

    protected computeSpecific(): { [id: string]: any } {
        return {};
    }
}
