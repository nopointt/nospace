import { render } from "solid-js/web"
import { Router, Route, Navigate } from "@solidjs/router"
import { lazy } from "solid-js"
import { setAuth } from "./lib/store"
import { API_BASE } from "./lib/api"
import "./index.css"

// Handle ?token= from OAuth redirects (Google callback)
const params = new URLSearchParams(window.location.search)
const tokenFromUrl = params.get("token")
if (tokenFromUrl) {
  // Fetch user info with this token, then store auth
  fetch(`${API_BASE}/api/billing`, { headers: { Authorization: `Bearer ${tokenFromUrl}` } })
    .then(r => r.json())
    .then(() => {
      setAuth({
        userId: "",
        apiToken: tokenFromUrl,
        mcpUrl: `${API_BASE}/sse?token=${tokenFromUrl}`,
      })
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname)
    })
    .catch(() => {
      // Token might be invalid, just clean URL
      window.history.replaceState({}, "", window.location.pathname)
    })
}

const Landing = lazy(() => import("./pages/Landing"))
const Hero = lazy(() => import("./pages/Hero"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const DocumentViewer = lazy(() => import("./pages/DocumentViewer"))
const ApiPage = lazy(() => import("./pages/ApiPage"))
const Settings = lazy(() => import("./pages/Settings"))

render(
  () => (
    <Router>
      <Route path="/" component={Landing} />
      <Route path="/app" component={Hero} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/documents/:id" component={DocumentViewer} />
      <Route path="/upload" component={() => <Navigate href="/app" />} />
      <Route path="/api" component={ApiPage} />
      <Route path="/settings" component={Settings} />
    </Router>
  ),
  document.getElementById("root")!,
)
