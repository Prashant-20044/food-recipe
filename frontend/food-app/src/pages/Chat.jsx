import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CheckCheck, SendHorizontal, Smile, Phone } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, getProfileImageUrl } from '../api'
import { useCall } from '../context/CallContext'

const quickEmojis = ['😀', '😂', '😍', '😋', '😊', '🔥', '👏', '❤️', '👍', '🙏', '🎉', '🍕', '🍜', '🥗', '☕', '🍰']

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const threadRef = useRef(null)
  const token = localStorage.getItem('token')
  const { startCall, socketReady } = useCall()

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const loadConversation = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const [userRes, messageRes] = await Promise.all([
        api.get(`/user/${id}`),
        api.get(`/message/${id}`, { headers: authHeaders })
      ])
      setOtherUser(userRes.data)
      setMessages(Array.isArray(messageRes.data) ? messageRes.data : [])
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load chat')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversation()
    const interval = setInterval(loadConversation, 5000)
    return () => clearInterval(interval)
  }, [id, token])

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!draft.trim()) return

    try {
      await api.post(`/message/${id}`, { text: draft.trim() }, { headers: authHeaders })
      setDraft('')
      setShowEmojiPicker(false)
      await loadConversation()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not send message')
    }
  }

  const startVideoCall = () => {
    if (!currentUser?._id || !otherUser?._id) return

    startCall(otherUser)
  }

  return (
    <div className='messages-shell'>
      <section className='chat-panel'>
        <div className='chat-topbar'>
          <div className='chat-topbar-left'>
            <button className='back-link-button' onClick={() => navigate('/messages')} aria-label='Back to messages'>
              <ArrowLeft size={18} />
              Back
            </button>
            {otherUser && <img src={getProfileImageUrl(otherUser)} alt={otherUser.username} />}
            <div className='chat-user-info'>
              <h2>{otherUser?.username || 'Message'}</h2>
              <p>{otherUser?.email || 'Private conversation'}</p>
            </div>
          </div>
          <button 
            className='video-call-btn' 
            onClick={startVideoCall}
            disabled={!otherUser || !currentUser?._id || !socketReady}
            aria-label='Start video call'
            title={socketReady ? 'Start video call' : 'Connecting call service...'}
          >
            <Phone size={20} />
          </button>
        </div>

        <div className='chat-thread' ref={threadRef}>
          {loading ? (
            <div className='profile-state'>Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className='profile-state'>No messages yet. Start the conversation.</div>
          ) : (
            messages.map((message) => {
              const isMe = message.sender?._id === currentUser?._id
              return (
                <div key={message._id} className={`chat-bubble ${isMe ? 'me' : 'them'}`}>
                  <p>{message.text}</p>
                  <span className='message-meta'>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && message.readAt && (
                      <span className='seen-status'>
                        <CheckCheck size={13} />
                        Seen
                      </span>
                    )}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {error && <div className='chat-inline-error'>{error}</div>}

        <div className='chat-composer'>
          <div className='emoji-picker-wrap'>
            <button
              type='button'
              className='emoji-toggle'
              onClick={() => setShowEmojiPicker((value) => !value)}
              aria-label='Choose emoji'
            >
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div className='emoji-picker'>
                {quickEmojis.map((emoji) => (
                  <button
                    type='button'
                    key={emoji}
                    onClick={() => setDraft((value) => `${value}${emoji}`)}
                    aria-label={`Add ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage()
              if (e.key === 'Escape') setShowEmojiPicker(false)
            }}
            placeholder='Message...'
          />
          <button className='send-message-btn' onClick={sendMessage} disabled={!draft.trim()} aria-label='Send message'>
            <SendHorizontal size={19} />
            <span>Send</span>
          </button>
        </div>
      </section>
    </div>
  )
}
