import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, getProfileImageUrl } from '../api'

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

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

  const sendMessage = async () => {
    if (!draft.trim()) return

    try {
      await api.post(`/message/${id}`, { text: draft.trim() }, { headers: authHeaders })
      setDraft('')
      await loadConversation()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not send message')
    }
  }

  return (
    <div className='messages-shell'>
      <section className='chat-panel'>
        <div className='chat-topbar'>
          <button className='back-link-button' onClick={() => navigate('/messages')}>Back</button>
          {otherUser && <img src={getProfileImageUrl(otherUser)} alt={otherUser.username} />}
          <div>
            <h2>{otherUser?.username || 'Message'}</h2>
            <p>{otherUser?.email || 'Private conversation'}</p>
          </div>
        </div>

        <div className='chat-thread'>
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
                  <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )
            })
          )}
        </div>

        {error && <div className='chat-inline-error'>{error}</div>}

        <div className='chat-composer'>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage()
            }}
            placeholder='Message...'
          />
          <button onClick={sendMessage} disabled={!draft.trim()}>Send</button>
        </div>
      </section>
    </div>
  )
}
