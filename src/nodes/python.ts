/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import { loadPyodide } from "pyodide";

const py = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/" });
await py.loadPackage(["micropip", "matplotlib"]);

console.log("LOADED");
export default class PythonNode extends Node {
    constructor() {
        super(
            NodeName.Python,
            "string",
            100,
            { x: 0, y: 0 },
            {
                0: {
                    name: "string",
                    pinLayout: PinLayout.RIGHT_PIN,
                    contentType: "monaco",
                    data: {
                        value: ""
                    }
                }
            }
        );
    }

    static createFromJson(json: string): PythonNode {
        let node = new PythonNode();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(): { [id: string]: any } {
        const output = py.runPython(this.connectors[0].data.value);
        return { "0": output };
    }
}
