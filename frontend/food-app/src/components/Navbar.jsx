import React, { useEffect, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { api, getProfileImageUrl } from '../api'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  let token = localStorage.getItem("token")
  const [isLogin, setIsLogin] = useState(token ? false : true)
  let user = JSON.parse(localStorage.getItem("user"))
  const [scrolled, setScrolled] = useState(false)
  const [profileSearch, setProfileSearch] = useState('')
  const [profileSuggestions, setProfileSuggestions] = useState([])
  const [isSearchingProfiles, setIsSearchingProfiles] = useState(false)
  const [showProfileSuggestions, setShowProfileSuggestions] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const searchRef = useRef(null)
  const needsSolidNav = location.pathname.startsWith('/profile') || location.pathname.startsWith('/messages')

  useEffect(() => {
    setIsLogin(token ? false : true)
  }, [token])

  useEffect(() => {
    if (!token) {
      setUnreadMessages(0)
      return undefined
    }

    let cancelled = false
    const loadUnreadMessages = async () => {
      try {
        const res = await api.get('/message', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!cancelled) {
          setUnreadMessages(Number(res.data?.unreadCount) || 0)
        }
      } catch {
        if (!cancelled) {
          setUnreadMessages(0)
        }
      }
    }

    loadUnreadMessages()
    const interval = setInterval(loadUnreadMessages, 10000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [token, location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const query = profileSearch.trim()
    if (!query) {
      setProfileSuggestions([])
      setIsSearchingProfiles(false)
      return
    }

    let cancelled = false
    setIsSearchingProfiles(true)

    const searchTimer = setTimeout(async () => {
      try {
        const res = await api.get('/user/search', { params: { q: query } })
        if (!cancelled) {
          setProfileSuggestions(Array.isArray(res.data) ? res.data : [])
        }
      } catch {
        if (!cancelled) {
          setProfileSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setIsSearchingProfiles(false)
        }
      }
    }, 220)

    return () => {
      cancelled = true
      clearTimeout(searchTimer)
    }
  }, [profileSearch])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowProfileSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setShowProfileSuggestions(false)
    setProfileSearch('')
  }, [location.pathname])

  const checkLogin = () => {
    navigate("/login")
  }

  const openProfile = (profile) => {
    if (!profile?._id) return
    setShowProfileSuggestions(false)
    setProfileSearch('')
    navigate(`/profile/${profile._id}`)
  }

  const submitProfileSearch = (e) => {
    e.preventDefault()
    const firstSuggestion = profileSuggestions[0]
    if (firstSuggestion) {
      openProfile(firstSuggestion)
    }
  }

  return (
    <>
      <header className={`${scrolled ? 'scrolled' : ''} ${needsSolidNav ? 'profile-nav' : ''}`.trim()}>
        <h2>🍳 TasteNest</h2>
        <form className='nav-profile-search' onSubmit={submitProfileSearch} ref={searchRef}>
          <input
            type='search'
            value={profileSearch}
            onChange={(e) => {
              setProfileSearch(e.target.value)
              setShowProfileSuggestions(true)
            }}
            onFocus={() => setShowProfileSuggestions(true)}
            placeholder='Search profiles'
            aria-label='Search profiles by username'
            autoComplete='off'
          />
          {showProfileSuggestions && profileSearch.trim() && (
            <div className='nav-profile-suggestions'>
              {isSearchingProfiles ? (
                <div className='nav-profile-search-state'>Searching...</div>
              ) : profileSuggestions.length > 0 ? (
                profileSuggestions.map((profile) => (
                  <button
                    key={profile._id}
                    type='button'
                    className='nav-profile-suggestion'
                    onClick={() => openProfile(profile)}
                  >
                    <img src={getProfileImageUrl(profile)} alt={profile.username} />
                    <span>{profile.username}</span>
                  </button>
                ))
              ) : (
                <div className='nav-profile-search-state'>No profiles found</div>
              )}
            </div>
          )}
        </form>
        <ul>
          <li><NavLink to="/">Home</NavLink></li>
          <li onClick={() => isLogin && navigate("/login")}><NavLink to={!isLogin ? "/myRecipe" : "/"}>My Recipes</NavLink></li>
          <li onClick={() => isLogin && navigate("/favRecipe")}><NavLink to={!isLogin ? "/favRecipe" : "/"}>Favourites</NavLink></li>
          {!isLogin && (
            <li>
              <button
                type="button"
                className='nav-message-btn'
                onClick={() => navigate('/messages')}
                aria-label={unreadMessages > 0 ? `Open messages, ${unreadMessages} unread` : 'Open messages'}
                title='Messages'
              >
                <MessageCircle size={21} strokeWidth={2.4} />
                {unreadMessages > 0 && (
                  <span className='nav-message-badge'>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </button>
            </li>
          )}
          {!isLogin && (
            <li>
              <button
                type="button"
                className='nav-profile-btn'
                onClick={() => navigate('/profile/me')}
                aria-label="Open profile"
              >
                <img src={getProfileImageUrl(user)} alt={user?.username || 'Profile'} />
              </button>
            </li>
          )}
          {isLogin && (
            <li onClick={checkLogin}>
              <p className='login'>Login</p>
            </li>
          )}
        </ul>
      </header>
    </>
  )
}
