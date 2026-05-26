import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { api } from '../api'
import '../styles/VideoCallModal.css'

/* ── Fallback STUN-only config (free Google servers) ─────────── */
const STUN_ONLY_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' }
  ]
}

/* ── Fetch TURN + STUN config from backend ───────────────────── */
const fetchIceServers = async () => {
  try {
    const { data } = await api.get('/api/turn/credentials')
    if (data?.iceServers?.length) {
      console.log('[WebRTC] Using TURN + STUN servers')
      return { iceServers: data.iceServers }
    }
  } catch {
    // TURN not configured — fall back to STUN only
  }
  console.log('[WebRTC] Using STUN-only (no TURN configured)')
  return STUN_ONLY_CONFIG
}

export default function VideoCallModal({
  isOpen,
  mode = 'outgoing',
  onClose,
  recipientName,
  recipientId,
  currentUserId,
  currentUserName,
  roomId,
  socket
}) {
  const [callState, setCallState] = useState('idle')
  const [statusText, setStatusText] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [hasRemoteStream, setHasRemoteStream] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const timerRef = useRef(null)
  const closingRef = useRef(false)
  const iceQueueRef = useRef([])
  const pendingSignalsRef = useRef([]) // Queue signals if PC isn't ready
  const didInitRef = useRef(false)

  // ── Store latest props in refs so effects don't re-run ──────
  const propsRef = useRef({})
  propsRef.current = { socket, recipientId, recipientName, currentUserId, currentUserName, roomId, mode, onClose }

  /* ── Helpers ────────────────────────────────────────────────── */
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCallDuration(0)
    timerRef.current = setInterval(() => setCallDuration((v) => v + 1), 1000)
  }, [])

  /* ── Teardown everything ────────────────────────────────────── */
  const teardown = useCallback((notify = false) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.ontrack = null
      pcRef.current.onicecandidate = null
      pcRef.current.onconnectionstatechange = null
      pcRef.current.oniceconnectionstatechange = null
      pcRef.current.close()
      pcRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    iceQueueRef.current = []
    pendingSignalsRef.current = []
    setHasRemoteStream(false)

    if (notify) {
      const { socket: s, recipientId: rid } = propsRef.current
      if (s && rid) s.emit('end-call', { recipientId: rid })
    }
  }, [])

  const endCall = useCallback((notify = true) => {
    teardown(notify)
    setCallState('ended')
    setStatusText('Call ended')

    setTimeout(() => {
      closingRef.current = false
      didInitRef.current = false
      setCallState('idle')
      setStatusText('')
      setCallDuration(0)
      setIsMuted(false)
      setIsVideoOn(true)
      setHasRemoteStream(false)
      propsRef.current.onClose?.()
    }, 600)
  }, [teardown])

  const remoteStreamRef = useRef(null)

  /* ── Attach streams when UI becomes active ────────────────── */
  useEffect(() => {
    if (callState === 'active') {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
      if (remoteVideoRef.current && remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current
      }
    }
  }, [callState])

  /* ── Build a fresh RTCPeerConnection ────────────────────────── */
  const buildPC = useCallback((rtcConfig = STUN_ONLY_CONFIG) => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }

    const pc = new RTCPeerConnection(rtcConfig)

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const { socket: s, recipientId: rid } = propsRef.current
        s?.emit('ice-candidate', { recipientId: rid, candidate: e.candidate })
      }
    }

    pc.ontrack = (e) => {
      const [stream] = e.streams
      if (stream) {
        remoteStreamRef.current = stream
        setHasRemoteStream(true)
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream
      }
    }

    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState
      console.log('[WebRTC] ICE:', st)
      if (st === 'connected' || st === 'completed') {
        setCallState('active')
        setStatusText('')
        startTimer()
      }
      if (st === 'failed') {
        endCall(true)
      }
    }

    pcRef.current = pc
    return pc
  }, [startTimer, endCall])

  /* ────────────────────────────────────────────────────────────
     SINGLE EFFECT: handles the entire call lifecycle.
     Only depends on `isOpen` so it runs exactly once per open.
     ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) {
      didInitRef.current = false
      return
    }

    // Prevent double-init from React strict mode
    if (didInitRef.current) return
    didInitRef.current = true
    closingRef.current = false

    const { socket: sock, recipientId: rid, currentUserId: uid, currentUserName: uname, recipientName: rname, roomId: room, mode: callMode } = propsRef.current
    if (!sock || !rid || !uid || !room) return

    let mounted = true

    /* ── Socket handlers (defined here so they share closure) ── */

    const onCallAccepted = async (payload) => {
      if (payload?.roomId && payload.roomId !== room) return
      console.log('[WebRTC] Call accepted → creating offer')
      const pc = pcRef.current
      if (!pc) return
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sock.emit('webrtc-offer', { recipientId: rid, offer: pc.localDescription })
        console.log('[WebRTC] Offer sent')
        setStatusText('Connecting...')
      } catch (err) {
        console.error('[WebRTC] Offer error:', err)
      }
    }

    const onOffer = async ({ offer }) => {
      console.log('[WebRTC] Received offer')
      const pc = pcRef.current
      if (!pc) {
        console.log('[WebRTC] PC not ready, queueing offer')
        pendingSignalsRef.current.push({ type: 'offer', data: offer })
        return
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        // flush queued ICE
        for (const c of iceQueueRef.current) await pc.addIceCandidate(new RTCIceCandidate(c))
        iceQueueRef.current = []
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sock.emit('webrtc-answer', { recipientId: rid, answer: pc.localDescription })
        console.log('[WebRTC] Answer sent')
      } catch (err) {
        console.error('[WebRTC] Answer error:', err)
      }
    }

    const onAnswer = async ({ answer }) => {
      console.log('[WebRTC] Received answer')
      const pc = pcRef.current
      if (!pc) {
        console.log('[WebRTC] PC not ready, queueing answer')
        pendingSignalsRef.current.push({ type: 'answer', data: answer })
        return
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        for (const c of iceQueueRef.current) await pc.addIceCandidate(new RTCIceCandidate(c))
        iceQueueRef.current = []
      } catch (err) {
        console.error('[WebRTC] setRemoteDesc error:', err)
      }
    }

    const onIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current
      if (!pc) {
        pendingSignalsRef.current.push({ type: 'candidate', data: candidate })
        return
      }
      try {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } else {
          iceQueueRef.current.push(candidate)
        }
      } catch (err) {
        console.error('[WebRTC] ICE error:', err)
      }
    }

    const onDeclined = () => { if (mounted) endCall(false) }
    const onEnded = () => { if (mounted) endCall(false) }
    const onOffline = () => {
      setStatusText(`${rname || 'User'} is offline`)
      if (mounted) endCall(false)
    }

    // Attach listeners
    sock.on('call-accepted', onCallAccepted)
    sock.on('webrtc-offer', onOffer)
    sock.on('webrtc-answer', onAnswer)
    sock.on('ice-candidate', onIceCandidate)
    sock.on('call-declined', onDeclined)
    sock.on('call-ended', onEnded)
    sock.on('user-offline', onOffline)

    /* ── Init ───────────────────────────────────────────────── */
    const init = async () => {
      try {
        setCallState(callMode === 'outgoing' ? 'calling' : 'loading')
        setStatusText(callMode === 'outgoing' ? `Calling ${rname || 'user'}...` : 'Connecting...')

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return }

        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        // Fetch TURN + STUN credentials (falls back to STUN-only)
        const rtcConfig = await fetchIceServers()

        const pc = buildPC(rtcConfig)
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))

        if (callMode === 'outgoing') {
          sock.emit('call-user', {
            recipientId: rid,
            callerId: uid,
            callerName: uname || 'TasteNest user',
            roomId: room
          })
          console.log('[WebRTC] call-user emitted')
        } else {
          console.log('[WebRTC] Recipient ready, wait or process queued signals...')
        }

        // Process any signals that arrived while we were initializing
        for (const signal of pendingSignalsRef.current) {
          console.log(`[WebRTC] Processing queued signal: ${signal.type}`)
          if (signal.type === 'offer') await onOffer({ offer: signal.data })
          else if (signal.type === 'answer') await onAnswer({ answer: signal.data })
          else if (signal.type === 'candidate') await onIceCandidate({ candidate: signal.data })
        }
        pendingSignalsRef.current = []
      } catch (err) {
        console.error('[WebRTC] Init error:', err)
        if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
          setStatusText('Camera/microphone access denied.')
        } else {
          setStatusText(err.message || 'Unable to start video call')
        }
        if (mounted) setCallState('ended')
      }
    }

    init()

    /* ── Cleanup on unmount ──────────────────────────────────── */
    return () => {
      mounted = false
      sock.off('call-accepted', onCallAccepted)
      sock.off('webrtc-offer', onOffer)
      sock.off('webrtc-answer', onAnswer)
      sock.off('ice-candidate', onIceCandidate)
      sock.off('call-declined', onDeclined)
      sock.off('call-ended', onEnded)
      sock.off('user-offline', onOffline)
      teardown(false)
      didInitRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  /* ── Controls ───────────────────────────────────────────────── */
  const toggleMute = () => {
    const next = !isMuted
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next })
    setIsMuted(next)
  }

  const toggleVideo = () => {
    const next = !isVideoOn
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = next })
    setIsVideoOn(next)
  }

  if (!isOpen) return null

  return (
    <div className="video-call-modal-overlay">
      <div className="video-call-modal">
        {(callState === 'loading' || callState === 'calling') && (
          <div className="call-loading">
            <div className="spinner"></div>
            <p>{statusText}</p>
            {callState === 'calling' && (
              <button className="btn-cancel-call" onClick={() => endCall(true)}>Cancel</button>
            )}
          </div>
        )}

        {callState === 'active' && (
          <>
            <div className="video-call-header">
              <h3>{recipientName || 'Video call'}</h3>
              <div className="call-duration">{formatTime(callDuration)}</div>
            </div>

            <div className="video-grid">
              <div className="video-container remote">
                <video ref={remoteVideoRef} autoPlay playsInline className="video-player" />
                {!hasRemoteStream && <span className="video-placeholder">Waiting for video...</span>}
                <span className="video-label">{recipientName || 'Guest'}</span>
              </div>
              <div className="video-container local">
                <video ref={localVideoRef} autoPlay playsInline muted className="video-player" />
                <span className="video-label">You</span>
              </div>
            </div>

            <div className="video-call-controls">
              <button className={`control-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button className="control-btn end-call" onClick={() => endCall(true)} title="End call">
                <PhoneOff size={20} />
              </button>
              <button className={`control-btn ${!isVideoOn ? 'active' : ''}`} onClick={toggleVideo} title={isVideoOn ? 'Stop video' : 'Start video'}>
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            </div>
          </>
        )}

        {callState === 'ended' && (
          <div className="call-ended">
            <div className="call-ended-icon"><Phone size={32} /></div>
            <p>{statusText || 'Call ended'}</p>
            <p className="call-duration-final">{formatTime(callDuration)}</p>
            <button className="btn-close" onClick={() => endCall(false)}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
