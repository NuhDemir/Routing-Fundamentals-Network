// Dosya Yolu: src/components/atoms/Icon.jsx
import React from "react";
import * as icons from "lucide-react";

const Icon = ({ name, className, ...props }) => {
  // Gelen 'name' prop'una göre Lucide kütüphanesinden doğru ikonu bul
  const LucideIcon = icons[name];

  if (!LucideIcon) {
    // Eğer o isimde bir ikon yoksa, varsayılan bir ikon göster
    return <icons.HelpCircle className={className} {...props} />;
  }

  return <LucideIcon className={className} {...props} />;
};

export default Icon;
