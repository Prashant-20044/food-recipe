import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, getProfileImageUrl, getImageUrl } from '../api'

export default function Profile() {
  const { identifier = 'me' } = useParams()
  const navigate = useNavigate()
  const [profileUser, setProfileUser] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [conversations, setConversations] = useState([])
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [followRequests, setFollowRequests] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followRequestSent, setFollowRequestSent] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')

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

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return
    if (!token) {
      navigate('/login')
      return
    }

    const formData = new FormData()
    formData.append('profilePic', file)

    try {
      setPhotoUploading(true)
      setPhotoError('')
      const res = await api.patch('/profile/photo', formData, { headers: authHeaders })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setProfileUser((user) => ({ ...user, profilePic: res.data.user.profilePic }))
    } catch (err) {
      setPhotoError(err.response?.data?.message || err.response?.data?.error || 'Unable to update profile photo')
    } finally {
      setPhotoUploading(false)
    }
  }

  const loadFollowData = async (userId) => {
    if (!userId) return
    try {
      const followRes = await api.get(`/followers-following/${userId}`)
      const followerItems = followRes.data.followers || []
      const followingItems = followRes.data.following || []
      setFollowers(followerItems)
      setFollowing(followingItems)
      setIsFollowing(currentUser ? followerItems.some((f) => f._id === currentUser._id) : false)
    } catch (err) {
      console.error('Failed to load followers/following', err)
    }
  }

  const loadFollowRequests = async () => {
    if (!token) return

    try {
      const requestRes = await api.get('/follow-requests', { headers: authHeaders })
      setFollowRequests(Array.isArray(requestRes.data) ? requestRes.data : [])
    } catch (err) {
      console.error('Failed to load follow requests', err)
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
      setFollowRequests([])
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
          const [msgRes] = await Promise.all([
            api.get('/message', { headers: authHeaders }),
            loadFollowRequests()
          ])
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
      await api.post(`/follow/${profileUser._id}`, {}, { headers: authHeaders })
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
      await api.post(`/unfollow/${profileUser._id}`, {}, { headers: authHeaders })
      setIsFollowing(false)
      await loadFollowData(profileUser._id)
      alert('Unfollowed!')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unfollow')
      console.error(err)
    }
  }

  const handleAcceptRequest = async (senderId) => {
    if (!token) {
      navigate('/login')
      return
    }

    try {
      await api.post(`/follow-request/accept/${senderId}`, {}, { headers: authHeaders })
      setFollowRequests((requests) => requests.filter((request) => request.from?._id !== senderId))
      await loadFollowData(profileUser._id)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept follow request')
      console.error(err)
    }
  }

  const handleDenyRequest = async (senderId) => {
    if (!token) {
      navigate('/login')
      return
    }

    try {
      await api.post(`/follow-request/deny/${senderId}`, {}, { headers: authHeaders })
      setFollowRequests((requests) => requests.filter((request) => request.from?._id !== senderId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deny follow request')
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
        <div className='profile-avatar-wrap'>
          <img className='profile-hero-avatar' src={getProfileImageUrl(profileUser)} alt={profileUser.username || 'User'} />
          {isOwnProfile && (
            <label className='profile-photo-upload'>
              <input type='file' accept='image/*' onChange={handleProfilePhotoChange} disabled={photoUploading} />
              {photoUploading ? 'Uploading...' : 'Change Photo'}
            </label>
          )}
        </div>
        <div className='profile-hero-info'>
          <p className='section-tag'>TasteNest Profile</p>
          <h1>{profileUser.username || 'Food lover'}</h1>
          <p>{profileUser.email}</p>
          {photoError && <p className='profile-photo-error'>{photoError}</p>}
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
          <>
            <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
              Requests ({followRequests.length})
            </button>
            <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>Messages</button>
          </>
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
                    <img src={getImageUrl(recipe.coverImage)} alt={recipe.title} />
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
      ) : activeTab === 'requests' ? (
        <section className='profile-requests-section'>
          <h3>Follow Requests ({followRequests.length})</h3>
          {followRequests.length === 0 ? (
            <div className='profile-state'>No pending follow requests.</div>
          ) : (
            <div className='user-list'>
              {followRequests.map((request) => {
                const sender = request.from
                if (!sender) return null

                return (
                  <div key={request._id || sender._id} className='user-card follow-request-card'>
                    <button type='button' className='request-user' onClick={() => navigate(`/profile/${sender._id}`)}>
                      <img src={getProfileImageUrl(sender)} alt={sender.username} />
                      <div>
                        <strong>{sender.username}</strong>
                        <p>{sender.email}</p>
                      </div>
                    </button>
                    <div className='follow-request-actions'>
                      <button type='button' className='btn-primary request-action-btn' onClick={() => handleAcceptRequest(sender._id)}>
                        Accept
                      </button>
                      <button type='button' className='btn-secondary request-action-btn' onClick={() => handleDenyRequest(sender._id)}>
                        Deny
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      ) : (
        <section className='conversation-list profile-conversations'>
          {conversations.length === 0 ? (
            <div className='profile-state'>No one has contacted you yet.</div>
          ) : (
            conversations.map((conv) => {
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
                    <small>{conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleDateString() : ''}</small>
                    {conv.unreadCount > 0 && <span className='unread-badge'>{conv.unreadCount}</span>}
                  </div>
                </button>
              )
            })
          )}
        </section>
      )}
    </div>
  )
}
