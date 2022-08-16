import { ConnectorContentProps } from "oura-node-editor";
import * as THREE from "three";
import { useEffect, useRef } from "react";

const ThreeJs = (props: ConnectorContentProps): JSX.Element => {
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (divRef.current) {
            const div = divRef.current;
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer();
            const light = new THREE.PointLight( 0xff0000, 1, 100 );
            light.position.set( 1, 1, 1 );
            scene.add(light);
            renderer.setSize(500, 500);
            div.appendChild(renderer.domElement);
            camera.position.z = 5;

            if (props.connector.data.obj) {
                scene.add(props.connector.data.obj)
            }

            let id = 0;
            const animate = () => {
                id = requestAnimationFrame( animate );
                renderer.render( scene, camera );
            }
            animate();

            return () => {
                cancelAnimationFrame(id);
                div.removeChild(renderer.domElement);
                renderer.dispose();
            }
        }
    }, [divRef, props.connector.data]);

    return (
        <div style={{ width: 500, height: 500 }} ref={divRef}></div>
    );
};

export default ThreeJs;

