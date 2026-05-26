import React from 'react'

export default function Modal({ children, onClose }) {
  return (
    <>
      <div className='backdrop' onClick={onClose}></div>
      <div className='modal'>
        {/* Decorative left panel */}
        <div className='modal-decor'>
          <div className='modal-decor-content'>
            <div className='modal-decor-emoji'>🍳</div>
            <h2>TasteNest</h2>
            <p>Your culinary journey starts here</p>
            <div className='modal-decor-dots'>
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
        {/* Form panel */}
        <div className='modal-form-panel'>
          <button className='modal-close' onClick={onClose} aria-label="Close">✕</button>
          {children}
        </div>
      </div>
    </>
  )
}
