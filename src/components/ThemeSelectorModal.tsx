import React from 'react'

export interface ThemeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
}

// Simple modal without portal for debugging
export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose, children }) => {
  
  if (!isOpen) {
    return null
  }

  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 50000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          zIndex: 50001
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Theme & Background</h2>
          <button
            onClick={() => {
              onClose()
            }}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
        <div style={{ color: 'white' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default ThemeSelectorModal


