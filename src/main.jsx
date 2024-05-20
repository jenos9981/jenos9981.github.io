import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import "remixicon/fonts/remixicon.css";
import "./index.scss";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConfigProvider
    theme={{
      // 1. Use dark algorithm
      algorithm: theme.darkAlgorithm,

      // 2. Combine dark algorithm and compact algorithm
      // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
    }}
  >
    <AntdApp>
      <App />
    </AntdApp>
  </ConfigProvider>
);
