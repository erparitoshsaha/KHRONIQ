import React from 'react';

export default function LogoMark({ className = "w-10 h-10", style = {} }) {
  return (
    <img 
      src="/assets/logo_icon.png" 
      alt="KHRONIQ Logo" 
      className={className}
      style={{
        objectFit: 'contain',
        ...style
      }}
    />
  );
}
