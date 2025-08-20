// Dosya Yolu: src/components/templates/MainLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom"; // Outlet'i import et
import Header from "../organisms/Header";
import Sidebar from "../organisms/Sidebar";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mobil menü butonuna basıldığında hem menüyü aç/kapa hem de linke tıklanmışsa kapat
  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={handleMenuClick} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        <main className="flex-1 p-6 md:p-10">
          {/* {children} yerine Outlet kullanıyoruz */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
