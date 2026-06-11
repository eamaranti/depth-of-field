import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CustomThemeProvider } from "./ThemeContext.tsx";

import App from "./App.tsx";
import DepthOfFieldPage from "./pages/DepthOfFieldPage.tsx";
import ExposureTrianglePage from "./pages/ExposureTrianglePage.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CustomThemeProvider>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<DepthOfFieldPage />} />
            <Route path="triangulo" element={<ExposureTrianglePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CustomThemeProvider>
  </React.StrictMode>
);
