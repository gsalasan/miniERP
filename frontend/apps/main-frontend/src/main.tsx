import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// install geolocation gate early to avoid unexpected native permission popups
import { installGeoGate } from './utils/geoGate';

installGeoGate();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
