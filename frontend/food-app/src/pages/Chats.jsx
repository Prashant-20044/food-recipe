import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getProfileImageUrl } from '../api'

export default function Chats() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const loadChats = async () => {
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const res = await api.get('/message', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setConversations(res.data.conversations || [])
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [token])

  return (
    <div className='messages-shell'>
      <section className='messages-panel'>
        <div className='messages-header'>
          <button className='back-link-button' onClick={() => navigate('/profile/me')}>Back</button>
          <div>
            <p className='section-tag'>Inbox</p>
            <h1>Messages</h1>
          </div>
        </div>

        {loading ? (
          <div className='profile-state'>Loading messages...</div>
        ) : error ? (
          <div className='profile-state'>{error}</div>
        ) : conversations.length === 0 ? (
          <div className='profile-state'>No conversations yet.</div>
        ) : (
          <div className='conversation-list'>
            {conversations.map((conv) => {
              const lastSenderId = conv.lastMessage?.sender?._id || conv.lastMessage?.sender
              const lastWasMine = lastSenderId === currentUser?._id
              return (
                <button key={conv.user._id} className='conversation' onClick={() => navigate(`/messages/${conv.user._id}`)}>
                  <img src={getProfileImageUrl(conv.user)} alt={conv.user.username} />
                  <div className='conversation-meta'>
                    <strong>{conv.user.username}</strong>
                    <span>
                      {lastWasMine ? `${conv.lastMessage?.readAt ? 'Seen' : 'Sent'}: ` : ''}
                      {conv.lastMessage?.text || 'Open conversation'}
                    </span>
                  </div>
                  <div className='conversation-side'>
                    <small>{conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleString() : ''}</small>
                    {conv.unreadCount > 0 && <span className='unread-badge'>{conv.unreadCount}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
