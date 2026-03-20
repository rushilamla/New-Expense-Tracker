import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const rootEl = document.getElementById("app");
if (!rootEl) throw new Error("Missing #app mount node");

ReactDOM.createRoot(rootEl).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(BrowserRouter, null, React.createElement(App))
  )
);
