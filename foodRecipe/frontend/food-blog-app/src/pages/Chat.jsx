import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, API_BASE_URL } from '../api'

export default function Chat() {
  const { id: otherUserId } = useParams()
  const navigate = useNavigate()
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') ?? 'null')
    } catch {
      return null
    }
  }, [])

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const resolveUserId = async (identifier) => {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier)
    if (isObjectId) return identifier

    try {
      const res = await api.get(`/user/username/${encodeURIComponent(identifier)}`)
      return res.data._id
    } catch {
      return null
    }
  }

  const fetchConversation = async () => {
    if (!token) return

    const targetId = await resolveUserId(otherUserId)
    if (!targetId) {
      setError('Unable to resolve chat partner')
      setLoading(false)
      return
    }

    try {
      const res = await api.get(`/message/${targetId}`, {
        headers: authHeaders
      })
      setMessages(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load messages')
    } finally {
      setLoading(false)
    }
  }

  const fetchOtherUser = async () => {
    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(otherUserId)
      const url = isObjectId
        ? `/user/${otherUserId}`
        : `/user/username/${encodeURIComponent(otherUserId)}`

      const res = await api.get(url)
      setOtherUser(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load user')
    }
  }

  useEffect(() => {
    if (!token) {
      setError('Please login to chat with other users.')
      return
    }

    fetchOtherUser()
    fetchConversation()
    const interval = setInterval(fetchConversation, 5000)
    return () => clearInterval(interval)
  }, [otherUserId, token])

  const sendMessage = async () => {
    setError("")
    if (!draft.trim()) {
      return
    }
    try {
      await api.post(
        `/message/${otherUserId}`,
        { text: draft.trim() },
        { headers: authHeaders }
      )
      setDraft("")
      await fetchConversation()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send message')
    }
  }

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Chat</h2>
        <p>Please login to view and send messages.</p>
        <button onClick={() => navigate('/')}>Go home</button>
      </div>
    )
  }

  return (
    <div className='chat-page'>
      <div className='chat-header'>
        <button className='back-button' onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h2>Chat with {otherUser?.username || 'user'}</h2>
          {otherUser?.email && <div style={{ fontSize: '0.9rem', color: '#555' }}>{otherUser.email}</div>}
        </div>
      </div>

      <div className='chat-body'>
        {loading ? (
          <div className='chat-loading'>Loading messages…</div>
        ) : (
          <div className='message-list'>
            {messages.length === 0 ? (
              <div className='chat-empty'>No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender?._id === currentUser?._id
                return (
                  <div key={msg._id} className={`message ${isMe ? 'me' : 'other'}`}>
                    <div className='message-text'>{msg.text}</div>
                    <div className='message-meta'>
                      <span className='message-user'>{isMe ? 'You' : msg.sender?.username ?? 'Them'}</span>
                      <span className='message-time'>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      <div className='chat-footer'>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='Type your message...'
          rows={2}
        />
        <button onClick={sendMessage} disabled={!draft.trim()}>
          Send
        </button>
      </div>

      {error && <div className='chat-error'>{error}</div>}
    </div>
  )
}
