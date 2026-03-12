import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, API_BASE_URL } from '../api'

export default function Chats() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [error, setError] = useState('')
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

  const fetchConversations = async () => {
    if (!token) {
      setError('Please login to see your chats.')
      setLoading(false)
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await api.get('/message', {
        headers: authHeaders
      })
      setConversations(res.data.conversations || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load chats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 8000)
    return () => clearInterval(interval)
  }, [token])

  const openChat = (userId) => {
    navigate(`/chat/${userId}`)
  }

  return (
    <div className='chat-page'>
      <div className='chat-header'>
        <h2>Chats</h2>
      </div>

      <div className='chat-body'>
        {loading ? (
          <div className='chat-loading'>Loading conversations…</div>
        ) : error ? (
          <div className='chat-error'>{error}</div>
        ) : conversations.length === 0 ? (
          <div className='chat-empty'>No conversations yet. Start by visiting a user profile and sending a message.</div>
        ) : (
          <div className='conversation-list'>
            {conversations.map((conv) => {
              const other = conv.user
              const lastMsg = conv.lastMessage || {}
              const lastSenderId = lastMsg?.sender?._id ?? lastMsg?.sender
              const isUnread = lastSenderId && lastSenderId.toString() !== currentUser?._id
              return (
                <button
                  key={other._id}
                  className={`conversation ${isUnread ? 'unread' : ''}`}
                  onClick={() => openChat(other._id)}
                >
                  <div className='conversation-left'>
                    <img
                      src={other.profilePic ? `${API_BASE_URL}/profiles/${other.profilePic}` : `https://www.gravatar.com/avatar/${other.email ? other.email.trim().toLowerCase() : ''}?d=identicon&s=48`}
                      alt={other.username}
                      width={48}
                      height={48}
                      style={{ borderRadius: '50%' }}
                    />
                  </div>
                  <div className='conversation-meta'>
                    <div className='conversation-title'>
                      <strong>{other.username}</strong>
                      {isUnread && <span className='conversation-badge'>new</span>}
                    </div>
                    <div className='conversation-preview'>
                      {lastMsg.text ? lastMsg.text : 'No messages yet'}
                    </div>
                  </div>
                  <div className='conversation-time'>
                    {lastMsg.createdAt ? new Date(lastMsg.createdAt).toLocaleString() : ''}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
