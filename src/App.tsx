import React from "react";

import OuraCanvasApp from "./oura_canvas";
import "oura-node-editor/dist/tailwind.css";

const App = (): JSX.Element => (
    <div style={{ width: "100%", height: "100vh" }} className="App">
        <OuraCanvasApp />
    </div>
);

export default App;
