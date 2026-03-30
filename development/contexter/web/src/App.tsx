import { Route, Navigate } from "@solidjs/router"
import { lazy } from "solid-js"

const Landing = lazy(() => import("./pages/Landing"))
const Hero = lazy(() => import("./pages/Hero"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const DocumentViewer = lazy(() => import("./pages/DocumentViewer"))
const ApiPage = lazy(() => import("./pages/ApiPage"))
const Settings = lazy(() => import("./pages/Settings"))
const Privacy = lazy(() => import("./pages/Privacy"))
const Terms = lazy(() => import("./pages/Terms"))
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const ResetPassword = lazy(() => import("./pages/ResetPassword"))
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"))

export default function App() {
  return (
    <>
      <Route path="/" component={Landing} />
      <Route path="/app" component={Hero} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/documents/:id" component={DocumentViewer} />
      <Route path="/upload" component={() => <Navigate href="/app" />} />
      <Route path="/api" component={ApiPage} />
      <Route path="/settings" component={Settings} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="*" component={() => <Navigate href="/" />} />
    </>
  )
}
