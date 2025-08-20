// Dosya Yolu: src/components/organisms/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import Icon from "../atoms/Icon";

// Menü elemanlarını bir liste olarak dışarıda tanımlayalım ki yönetmesi kolay olsun
const menuItems = [
  { path: "/", title: "Routing Nedir?", icon: "BookOpen" },
  { path: "/types", title: "Routing Türleri", icon: "Network" },
  { path: "/protocols", title: "Routing Protokolleri", icon: "Globe" },
  { path: "/algorithms", title: "Routing Algoritmaları", icon: "Route" },
  { path: "/tables", title: "Routing Tabloları", icon: "FileText" },
  { path: "/practice", title: "Pratik Örnekler", icon: "Code" },
];

const Sidebar = ({ isOpen }) => {
  const baseClasses =
    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 mb-2";
  const activeClasses = "bg-blue-100 text-blue-700 font-bold";
  const inactiveClasses = "text-gray-700 hover:bg-blue-50 hover:text-blue-700";

  return (
    <aside
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out`}
    >
      <nav className="mt-8 px-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            // NavLink'in bu özelliği sayesinde aktif linki kolayca stillendirebiliriz
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            <Icon name={item.icon} className="w-5 h-5" />
            <span className="font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
