import React, { useState, useEffect, useRef } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  side = 'top', 
  delay = 300,
  maxWidth = '200px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShouldShow(true);
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShouldShow(false);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Smart positioning to avoid viewport edges
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      
      // Check if tooltip goes off screen and adjust
      if (rect.right > window.innerWidth) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '0';
      }
      if (rect.left < 0) {
        tooltip.style.left = '0';
        tooltip.style.right = 'auto';
      }
    }
  }, [isVisible]);

  const getPositionClasses = () => {
    switch (side) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shouldShow && (
        <div 
          ref={tooltipRef}
          className={`absolute w-max bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-md py-1 px-2 z-50 pointer-events-none transition-opacity duration-150 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          } ${getPositionClasses()}`}
          style={{ maxWidth }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
