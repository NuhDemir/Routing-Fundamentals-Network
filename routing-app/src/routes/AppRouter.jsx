// Dosya Yolu: src/routes/AppRouter.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Sayfalarımızı ve layout'u import edelim
import MainLayout from "../components/templates/MainLayout";
import HomePage from "../pages/HomePage";
import TypesPage from "../pages/TypesPage";
import ProtocolsPage from "../pages/ProtocolsPage";
import AlgorithmsPage from "../pages/AlgorithmsPage";
import TablesPage from "../pages/TablesPage";
import PracticePage from "../pages/PracticePage";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* MainLayout'u ana route olarak belirliyoruz */}
        <Route path="/" element={<MainLayout />}>
          {/* İç içe route'lar (nested routes) layout'un içinde gösterilecek */}
          <Route index element={<HomePage />} /> {/* Ana sayfa (path: '/') */}
          <Route path="types" element={<TypesPage />} />
          <Route path="protocols" element={<ProtocolsPage />} />
          <Route path="algorithms" element={<AlgorithmsPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="practice" element={<PracticePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
