// Dosya Yolu: src/components/organisms/Section.jsx
import React from "react";

const Section = ({ title, children, className = "" }) => (
  <section className={`py-12 px-2 max-w-4xl mx-auto ${className}`}>
    <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b-2 border-blue-500 pb-2">
      {title}
    </h2>
    {children}
  </section>
);

export default Section;
