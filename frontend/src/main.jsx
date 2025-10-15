import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";
import "./styles/global.css";
import ThemeInit from "./components/ThemeInit.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeInit />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
