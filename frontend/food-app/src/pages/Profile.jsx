import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, API_BASE_URL, getProfileImageUrl } from '../api'

export default function Profile() {
  const { identifier = 'me' } = useParams()
  const navigate = useNavigate()
  const [profileUser, setProfileUser] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [conversations, setConversations] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followRequestSent, setFollowRequestSent] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
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

  const isOwnProfile = identifier === 'me' || identifier === currentUser?._id || identifier === currentUser?.username
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const loadFollowData = async (userId) => {
    if (!userId) return
    try {
      const followRes = await api.get(`/user/followers-following/${userId}`)
      const followerItems = followRes.data.followers || []
      const followingItems = followRes.data.following || []
      setFollowers(followerItems)
      setFollowing(followingItems)
      setIsFollowing(currentUser ? followerItems.some((f) => f._id === currentUser._id) : false)
    } catch (err) {
      console.error('Failed to load followers/following', err)
    }
  }

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser && identifier === 'me') {
        navigate('/login')
        return
      }

      setLoading(true)
      setError('')
      setProfileUser(null)
      setFollowers([])
      setFollowing([])
      setIsFollowing(false)
      setFollowRequestSent(false)

      try {
        const targetUser = identifier === 'me'
          ? currentUser
          : (await api.get(/^[0-9a-fA-F]{24}$/.test(identifier) ? `/user/${identifier}` : `/user/username/${identifier}`)).data

        setProfileUser(targetUser)

        const recipeRes = await api.get(`/recipe/user/${targetUser._id}`)
        setRecipes(Array.isArray(recipeRes.data) ? recipeRes.data : [])

        await loadFollowData(targetUser._id)

        if (isOwnProfile && token) {
          const msgRes = await api.get('/message', { headers: authHeaders })
          setConversations(msgRes.data.conversations || [])
        }
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [identifier, token, currentUser])

  const handleFollowRequest = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    try {
      await api.post(`/user/follow/${profileUser._id}`, {}, { headers: authHeaders })
      setFollowRequestSent(true)
      alert('Follow request sent!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send follow request')
      console.error(err)
    }
  }

  const handleUnfollow = async () => {
    if (!token) return

    try {
      await api.post(`/user/unfollow/${profileUser._id}`, {}, { headers: authHeaders })
      setIsFollowing(false)
      await loadFollowData(profileUser._id)
      alert('Unfollowed!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unfollow')
      console.error(err)
    }
  }

  if (loading) {
    return <div className='profile-shell'><div className='profile-state'>Loading profile...</div></div>
  }

  if (error || !profileUser) {
    return <div className='profile-shell'><div className='profile-state'>{error || 'Profile not found'}</div></div>
  }

  return (
    <div className='profile-shell'>
      <section className='profile-hero-card'>
        <img className='profile-hero-avatar' src={getProfileImageUrl(profileUser)} alt={profileUser.username || 'User'} />
        <div className='profile-hero-info'>
          <p className='section-tag'>TasteNest Profile</p>
          <h1>{profileUser.username || 'Food lover'}</h1>
          <p>{profileUser.email}</p>
          <div className='profile-stats'>
            <span><strong>{recipes.length}</strong> posts</span>
            <span><strong>{followers.length}</strong> followers</span>
            <span><strong>{following.length}</strong> following</span>
          </div>
        </div>
        <div className='profile-actions'>
          {isOwnProfile ? (
            <>
              <button className='btn-secondary profile-action-btn' onClick={() => setActiveTab('messages')}>Messages</button>
              <button className='profile-logout-btn' onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              {isFollowing ? (
                <button className='btn-secondary profile-action-btn' onClick={handleUnfollow}>Unfollow</button>
              ) : (followRequestSent ? (
                <button className='btn-secondary profile-action-btn' disabled>Request Sent</button>
              ) : (
                <button className='btn-primary profile-action-btn' onClick={handleFollowRequest}>Send Follow Request</button>
              ))}
              <button className='btn-primary profile-action-btn' onClick={() => navigate(`/messages/${profileUser._id}`)}>Message</button>
            </>
          )}
        </div>
      </section>

      <div className='profile-tabs'>
        <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>Posts</button>
        {isOwnProfile && (
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>Messages</button>
        )}
      </div>

      {activeTab === 'posts' ? (
        <>
          <section className='profile-grid-section'>
            {recipes.length === 0 ? (
              <div className='profile-state'>No recipes posted yet.</div>
            ) : (
              <div className='profile-post-grid'>
                {recipes.map((recipe) => (
                  <button key={recipe._id} className='profile-post-card' onClick={() => navigate(`/recipe/${recipe._id}`)}>
                    <img src={`${API_BASE_URL}/images/${recipe.coverImage}`} alt={recipe.title} />
                    <span>{recipe.title}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {isOwnProfile && (
            <section className='followers-following-section'>
              <div className='followers-box'>
                <h3>Followers ({followers.length})</h3>
                {followers.length === 0 ? (
                  <div className='profile-state'>No followers yet.</div>
                ) : (
                  <div className='user-list'>
                    {followers.map((item) => (
                      <button key={item._id} className='user-card' onClick={() => navigate(`/profile/${item._id}`)}>
                        <img src={getProfileImageUrl(item)} alt={item.username} />
                        <div>
                          <strong>{item.username}</strong>
                          <p>{item.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className='following-box'>
                <h3>Following ({following.length})</h3>
                {following.length === 0 ? (
                  <div className='profile-state'>Not following anyone yet.</div>
                ) : (
                  <div className='user-list'>
                    {following.map((item) => (
                      <button key={item._id} className='user-card' onClick={() => navigate(`/profile/${item._id}`)}>
                        <img src={getProfileImageUrl(item)} alt={item.username} />
                        <div>
                          <strong>{item.username}</strong>
                          <p>{item.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className='conversation-list profile-conversations'>
          {conversations.length === 0 ? (
            <div className='profile-state'>No one has contacted you yet.</div>
          ) : (
            conversations.map((conv) => (
              <button key={conv.user._id} className='conversation' onClick={() => navigate(`/messages/${conv.user._id}`)}>
                <img src={getProfileImageUrl(conv.user)} alt={conv.user.username} />
                <div className='conversation-meta'>
                  <strong>{conv.user.username}</strong>
                  <span>{conv.lastMessage?.text || 'Open conversation'}</span>
                </div>
                <small>{conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleDateString() : ''}</small>
              </button>
            ))
          )}
        </section>
      )}
    </div>
  )
}
