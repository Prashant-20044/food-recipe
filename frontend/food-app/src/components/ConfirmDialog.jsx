import React from 'react'

export default function ConfirmDialog({ title, message, confirmText = "Yes", cancelText = "No", onConfirm, onCancel }) {
  return (
    <>
      <div className='confirm-backdrop' onClick={onCancel}></div>
      <div className='confirm-dialog' role='dialog' aria-modal='true' aria-labelledby='confirm-dialog-title'>
        <h3 id='confirm-dialog-title'>{title}</h3>
        <p>{message}</p>
        <div className='confirm-dialog-actions'>
          <button type='button' className='btn-secondary confirm-dialog-btn' onClick={onCancel}>
            {cancelText}
          </button>
          <button type='button' className='btn-primary confirm-dialog-btn danger' onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </>
  )
}
