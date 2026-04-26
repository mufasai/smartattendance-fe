/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";
import "./index.css";
import App from "./App";
import auth from "./store/auth";

// Initialize auth state from localStorage before rendering
auth.initFromStorage();

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employee = lazy(() => import("./pages/Employee"));
const ShiftManagement = lazy(() => import("./pages/ShiftManagement"));
const Patrol = lazy(() => import("./pages/Patrol"));

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

render(
  () => (
    <Router>
      <Route path="/login" component={Login} />
      <Route path="/" component={App}>
        <Route path="/" component={Dashboard} />
        <Route path="/employee" component={Employee} />
        <Route path="/shift" component={ShiftManagement} />
        <Route path="/patrol" component={Patrol} />
      </Route>
    </Router>
  ),
  root!,
);
