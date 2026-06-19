import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { BrowserRouter } from "react-router-dom";

import "antd/dist/reset.css";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { antdTheme } from "./styles/theme.js";

import "./styles/auth.css";
import "./styles/layout.css";
import "./styles/dashboard.css";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigProvider locale={viVN} theme={antdTheme}>
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
        >
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  </React.StrictMode>
);