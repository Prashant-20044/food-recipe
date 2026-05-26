import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import '../styles/IncomingCallModal.css';

export default function IncomingCallModal({ 
  isOpen, 
  callerName, 
  onAccept, 
  onDecline 
}) {
  if (!isOpen) return null;

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-container">
        <div className="incoming-call-content">
          <div className="caller-info">
            <div className="caller-icon">
              <Phone size={40} />
            </div>
            <h2>Incoming Call</h2>
            <p className="caller-name">{callerName}</p>
          </div>

          <div className="call-actions">
            <button 
              className="btn-decline"
              onClick={onDecline}
              title="Decline call"
            >
              <PhoneOff size={24} />
              <span>Decline</span>
            </button>

            <button 
              className="btn-accept"
              onClick={onAccept}
              title="Accept call"
            >
              <Phone size={24} />
              <span>Accept</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
