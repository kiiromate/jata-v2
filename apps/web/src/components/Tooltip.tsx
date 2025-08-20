import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded-md py-1 px-2 z-10 left-1/2 -translate-x-1/2">
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
