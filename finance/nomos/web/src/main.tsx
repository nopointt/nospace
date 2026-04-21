import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

import "./index.css";
import { AppShell } from "./AppShell";
import Overview from "./pages/Overview";
import Trades from "./pages/Trades";
import Strategies from "./pages/Strategies";
import Risk from "./pages/Risk";
import Charts from "./pages/Charts";
import Portfolio from "./pages/Portfolio";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

render(
  () => (
    <Router root={AppShell}>
      <Route path="/" component={Overview} />
      <Route path="/trades" component={Trades} />
      <Route path="/strategies" component={Strategies} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/charts" component={Charts} />
      <Route path="/risk" component={Risk} />
    </Router>
  ),
  root,
);
