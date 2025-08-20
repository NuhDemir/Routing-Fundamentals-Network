// Dosya Yolu: src/components/organisms/Header.jsx
import React from "react";
import Icon from "../atoms/Icon";

const Header = ({ onMenuClick }) => {
  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Icon name="Network" className="w-8 h-8" />
            <h1 className="text-xl font-bold">Network Routing Rehberi</h1>
          </div>
          <button
            onClick={onMenuClick} // Mobil menü butonu için tıklama olayı
            className="md:hidden p-2 rounded-md hover:bg-blue-800"
          >
            <Icon name="Menu" className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
