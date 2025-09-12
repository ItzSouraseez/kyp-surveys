'use client';

import { useState, useEffect } from 'react';

export default function Toast({ message, isVisible, onClose, type = 'success' }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyle = () => {
    const baseStyle = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '14px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'slideIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    };

    if (type === 'success') {
      return {
        ...baseStyle,
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '2px solid #c3e6cb'
      };
    }

    return baseStyle;
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div style={getToastStyle()}>
        <span>✅</span>
        <span>{message}</span>
      </div>
    </>
  );
}
