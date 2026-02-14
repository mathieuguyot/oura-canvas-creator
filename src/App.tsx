import { JSX } from "react";
import OuraCanvasApp from "./v2-poc/viewer";

const App = (): JSX.Element => (
    <div style={{ width: "100%", height: "100vh" }} className="App">
        <OuraCanvasApp />
    </div>
);

export default App;
