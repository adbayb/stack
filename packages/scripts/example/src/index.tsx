import { render } from "react-dom";
import { App } from "./App";

// @ts-expect-error to fix
render(<App />, document.getElementById("root"));
