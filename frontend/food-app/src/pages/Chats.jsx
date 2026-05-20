import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getProfileImageUrl } from '../api'

export default function Chats() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')

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
            {conversations.map((conv) => (
              <button key={conv.user._id} className='conversation' onClick={() => navigate(`/messages/${conv.user._id}`)}>
                <img src={getProfileImageUrl(conv.user)} alt={conv.user.username} />
                <div className='conversation-meta'>
                  <strong>{conv.user.username}</strong>
                  <span>{conv.lastMessage?.text || 'Open conversation'}</span>
                </div>
                <small>{conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleString() : ''}</small>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
