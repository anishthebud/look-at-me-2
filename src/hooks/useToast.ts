import { useState, useCallback } from 'react'

export interface CompletionModalMessage {
  id: string
  message: string
  taskName: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

export const useCompletionModal = () => {
  const [modal, setModal] = useState<CompletionModalMessage | null>(null)

  const showModal = useCallback((modalData: Omit<CompletionModalMessage, 'id'>) => {
    const id = crypto.randomUUID()
    const newModal: CompletionModalMessage = {
      id,
      ...modalData
    }
    
    setModal(newModal)
    
    // Auto-remove modal after duration
    if (modalData.duration !== 0) {
      setTimeout(() => {
        removeModal()
      }, modalData.duration || 4000)
    }
    
    return id
  }, [])

  const removeModal = useCallback(() => {
    setModal(null)
  }, [])

  const showSuccessModal = useCallback((taskName: string, message: string = 'has been completed successfully!') => {
    return showModal({
      message,
      taskName,
      type: 'success',
      duration: 4000
    })
  }, [showModal])

  const showErrorModal = useCallback((taskName: string, message: string = 'failed to complete') => {
    return showModal({
      message,
      taskName,
      type: 'error',
      duration: 5000
    })
  }, [showModal])

  const showInfoModal = useCallback((taskName: string, message: string) => {
    return showModal({
      message,
      taskName,
      type: 'info',
      duration: 3000
    })
  }, [showModal])

  return {
    modal,
    showModal,
    removeModal,
    showSuccessModal,
    showErrorModal,
    showInfoModal
  }
}

// Keep the old useToast export for backward compatibility
export const useToast = useCompletionModal

export default useToast
