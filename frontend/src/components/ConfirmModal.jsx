import React from 'react';

/**
 * Componente de Modal de confirmación
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {string} props.title - Título del modal
 * @param {string} props.message - Mensaje del modal
 * @param {string} props.confirmText - Texto del botón confirmar (default: "Confirmar")
 * @param {string} props.cancelText - Texto del botón cancelar (default: "Cancelar")
 * @param {Function} props.onConfirm - Callback al confirmar
 * @param {Function} props.onCancel - Callback al cancelar
 * @param {string} props.type - Tipo: 'danger', 'warning', 'info' (default: 'info')
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'info'
}) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: '🚪',
      confirmBg: 'bg-red-600 hover:bg-red-700',
      confirmText: 'text-white'
    },
    warning: {
      icon: '⚠️',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      confirmText: 'text-white'
    },
    info: {
      icon: 'ℹ️',
      confirmBg: 'bg-purple-600 hover:bg-purple-700',
      confirmText: 'text-white'
    }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className="relative rounded-2xl border shadow-2xl max-w-md w-full animate-scale-in"
        style={{ 
          background: 'var(--bg-surface)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <div className="p-6">
          {/* Icono */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                 style={{ background: 'linear-gradient(135deg, var(--accent-start), var(--accent-end))' }}>
              {style.icon}
            </div>
          </div>

          {/* Contenido */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>
              {title}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {message}
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border font-medium transition-colors"
              style={{ 
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)'
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-lg ${style.confirmBg} ${style.confirmText} font-medium transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
