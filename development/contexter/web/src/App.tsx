import { Route, Navigate } from "@solidjs/router"
import { lazy } from "solid-js"

const Hero = lazy(() => import("./pages/Hero"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const DocumentViewer = lazy(() => import("./pages/DocumentViewer"))
const ApiPage = lazy(() => import("./pages/ApiPage"))
const Settings = lazy(() => import("./pages/Settings"))

export default function App() {
  return (
    <>
      <Route path="/" component={Hero} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/documents/:id" component={DocumentViewer} />
      <Route path="/upload" component={() => <Navigate href="/" />} />
      <Route path="/api" component={ApiPage} />
      <Route path="/settings" component={Settings} />
    </>
  )
}
