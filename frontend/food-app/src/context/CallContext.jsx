import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import io from 'socket.io-client'
import { API_BASE_URL } from '../api'
import VideoCallModal from '../components/VideoCallModal'
import IncomingCallModal from '../components/IncomingCallModal'

const CallContext = createContext(null)

const readCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

const getSocketUrl = () => {
  return import.meta.env.VITE_SOCKET_URL?.trim() || API_BASE_URL || window.location.origin
}

const buildRoomId = (firstUserId, secondUserId) => {
  return `taste_call_${[firstUserId, secondUserId]
    .map((value) => String(value || ''))
    .sort()
    .join('_')}`
    .replace(/[^A-Za-z0-9_~-]/g, '_')
    .slice(0, 128)
}

export function CallProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(readCurrentUser)
  const [socket, setSocket] = useState(null)
  const [socketReady, setSocketReady] = useState(false)
  const [activeCall, setActiveCall] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null)

  useEffect(() => {
    const refreshUser = () => setCurrentUser(readCurrentUser())

    window.addEventListener('focus', refreshUser)
    window.addEventListener('storage', refreshUser)
    const interval = setInterval(refreshUser, 2000)

    return () => {
      window.removeEventListener('focus', refreshUser)
      window.removeEventListener('storage', refreshUser)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!currentUser?._id) {
      setIncomingCall(null)
      setSocket(null)
      setSocketReady(false)
      return undefined
    }

    const nextSocket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      withCredentials: true
    })

    const userName = currentUser.username || currentUser.email || 'TasteNest user'

    nextSocket.on('connect', () => {
      setSocketReady(true)
      nextSocket.emit('user-join', {
        userId: currentUser._id,
        username: userName
      })
    })

    nextSocket.on('disconnect', () => {
      setSocketReady(false)
    })

    nextSocket.on('incoming-call', (payload) => {
      setIncomingCall(payload)
    })

    nextSocket.on('call-cancelled', () => {
      setIncomingCall(null)
    })

    nextSocket.on('call-ended', () => {
      setIncomingCall(null)
    })

    setSocket(nextSocket)

    return () => {
      setSocketReady(false)
      nextSocket.disconnect()
      setSocket(null)
    }
  }, [currentUser?._id, currentUser?.email, currentUser?.username])

  const startCall = useCallback((recipient) => {
    if (!currentUser?._id || !recipient?._id || !socketReady) return

    setActiveCall({
      mode: 'outgoing',
      recipientId: recipient._id,
      recipientName: recipient.username || recipient.email || 'TasteNest user',
      roomId: buildRoomId(currentUser._id, recipient._id)
    })
  }, [currentUser?._id, socketReady])

  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall || !socket) return

    socket.emit('accept-call', {
      callerId: incomingCall.callerId,
      roomId: incomingCall.roomId
    })

    setActiveCall({
      mode: 'incoming',
      recipientId: incomingCall.callerId,
      recipientName: incomingCall.callerName || 'TasteNest user',
      roomId: incomingCall.roomId
    })
    setIncomingCall(null)
  }, [incomingCall, socket])

  const declineIncomingCall = useCallback(() => {
    if (incomingCall && socket) {
      socket.emit('decline-call', { callerId: incomingCall.callerId })
    }

    setIncomingCall(null)
  }, [incomingCall, socket])

  const value = useMemo(() => ({
    socket,
    socketReady,
    startCall,
    activeCall
  }), [activeCall, socket, socketReady, startCall])

  return (
    <CallContext.Provider value={value}>
      {children}

      <VideoCallModal
        isOpen={Boolean(activeCall)}
        mode={activeCall?.mode}
        onClose={() => setActiveCall(null)}
        recipientName={activeCall?.recipientName}
        recipientId={activeCall?.recipientId}
        currentUserId={currentUser?._id}
        currentUserName={currentUser?.username || currentUser?.email}
        roomId={activeCall?.roomId}
        socket={socket}
      />

      <IncomingCallModal
        isOpen={Boolean(incomingCall) && !activeCall}
        callerName={incomingCall?.callerName}
        onAccept={acceptIncomingCall}
        onDecline={declineIncomingCall}
      />
    </CallContext.Provider>
  )
}

export function useCall() {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used inside CallProvider')
  }

  return context
}
