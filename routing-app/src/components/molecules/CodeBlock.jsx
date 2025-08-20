// Dosya Yolu: src/components/molecules/CodeBlock.jsx
import React from "react";

const CodeBlock = ({ children, title }) => (
  <div className="bg-gray-900 text-green-400 p-4 my-6 rounded-lg font-mono text-sm overflow-x-auto">
    {title && <div className="text-gray-400 mb-2 font-sans">{title}</div>}
    <pre>{children}</pre>
  </div>
);

export default CodeBlock;
