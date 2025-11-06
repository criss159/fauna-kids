import React, { useEffect } from 'react';

/**
 * Componente de notificación tipo Toast
 * @param {Object} props
 * @param {string} props.message - Mensaje a mostrar
 * @param {string} props.type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} props.duration - Duración en ms (default: 3000)
 * @param {Function} props.onClose - Callback al cerrar
 */
export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-500'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-500'
    }
  };

  const style = colors[type] || colors.info;

  return (
    <div className="fixed top-20 right-4 z-[200] animate-slide-in-right">
      <div className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}>
        <div className="flex items-start gap-3">
          <span className={`text-2xl ${style.icon}`}>
            {icons[type]}
          </span>
          <div className="flex-1">
            <p className={`text-sm font-medium ${style.text}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${style.text} hover:opacity-70 transition-opacity text-lg leading-none`}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
