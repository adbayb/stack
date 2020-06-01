import React from "react";
import ReactDOM from "react-dom";
import toto from "./titi.ts";

interface Plop {}

const titi = { plop: true };

eval("plop");

const toto = (titi: string) => {
	titi = "45";
};

const App = () => {
	return <div>Hello world</div>;
};

ReactDOM.render(<App />, document.getElementById("root"));
