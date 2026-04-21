import { render } from "solid-js/web";
import { Router } from "@solidjs/router";

import "./index.css";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

render(() => <Router>{App}</Router>, root);
