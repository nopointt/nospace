import { render } from "solid-js/web"
import { Router, Route } from "@solidjs/router"
import { lazy } from "solid-js"
import "./index.css"

const Hero = lazy(() => import("./pages/Hero"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Upload = lazy(() => import("./pages/Upload"))
const ApiPage = lazy(() => import("./pages/ApiPage"))
const Settings = lazy(() => import("./pages/Settings"))

render(
  () => (
    <Router>
      <Route path="/" component={Hero} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/upload" component={Upload} />
      <Route path="/api" component={ApiPage} />
      <Route path="/settings" component={Settings} />
    </Router>
  ),
  document.getElementById("root")!,
)
