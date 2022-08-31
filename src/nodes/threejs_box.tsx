/* eslint-disable @typescript-eslint/no-explicit-any */
import Node from "./node";
import { PinLayout } from "oura-node-editor";
import { NodeName } from "./consts";
import * as THREE from "three";



export default class ThreeJSBox extends Node {
    cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;

    constructor() {
        super(NodeName.ThreeJSBox, 170, {x:0, y:0}, {
            0: {
                name: "output",
                pinLayout: PinLayout.RIGHT_PIN,
                contentType: "node",
                data: {}
            },
            1: {
                name: "rotation_x",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0, disabled: false }
            },
            2: {
                name: "rotation_y",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0, disabled: false }
            },
            3: {
                name: "rotation_z",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "number",
                data: { value: 0, disabled: false }
            },
            4: {
                name: "color",
                pinLayout: PinLayout.LEFT_PIN,
                contentType: "none",
                data: { value: "rgba(255,255,255,1)" },
                leftPinColor: "orange"
            }
        });
        const geometry = new THREE.BoxGeometry( 1, 1, 1 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        this.cube = new THREE.Mesh( geometry, material );
    }

    static createFromJson(json: string) : ThreeJSBox {
        let node = new ThreeJSBox();
        Node.initFromJson(json, node);
        return node;
    }

    computeSpecific(inputs: { [id: string]: any }): { [id: string]: any } {
        const rotation_x = "1" in inputs ? inputs[1] : this.connectors[1].data.value;
        const rotation_y = "2" in inputs ? inputs[2] : this.connectors[2].data.value;
        const rotation_z = "3" in inputs ? inputs[3] : this.connectors[3].data.value;
        const color = "4" in inputs ? inputs[4] : this.connectors[4].data.value;

        this.cube.material.color.setStyle(color);
        this.cube.rotation.set(rotation_x, rotation_y, rotation_z);
        
        return {"0": this.cube};
    }
}
