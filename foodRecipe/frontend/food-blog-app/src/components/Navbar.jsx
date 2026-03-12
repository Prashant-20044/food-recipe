import React, { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import InputForm from './InputForm'
import { NavLink, useNavigate } from 'react-router-dom'
import { api, API_BASE_URL } from '../api'

export default function Navbar() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const token = localStorage.getItem('token')
  const [isLogin, setIsLogin] = useState(token ? false : true)
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') ?? 'null')
    } catch {
      return null
    }
  }, [token])
  const [unreadChats, setUnreadChats] = useState(0)

  useEffect(() => {
    setIsLogin(token ? false : true)
  }, [token])

  useEffect(() => {
    if (!token) {
      setUnreadChats(0)
      return
    }

    const fetchChatStatus = async () => {
      try {
        const res = await api.get('/message', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const conversations = res.data?.conversations || []
        const currentUser = user
        const unread = conversations.filter((conv) => {
          const last = conv.lastMessage
          const lastSenderId = last?.sender?._id ?? last?.sender
          return lastSenderId && lastSenderId.toString() !== currentUser?._id
        }).length
        setUnreadChats(unread)
      } catch {
        setUnreadChats(0)
      }
    }

    fetchChatStatus()
    const interval = setInterval(fetchChatStatus, 10000)
    return () => clearInterval(interval)
  }, [token, user])

  const checkLogin = () => {
    if (token) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setIsLogin(true)
      navigate('/')
    } else {
      setIsOpen(true)
    }
  }

  const profileUrl = user?.username ? `/profile/${user.username}` : '/'

  return (
    <>
      <header>
        <h2 style={{ color: 'black', cursor: 'pointer' }} onClick={() => navigate('/')}>Food Blog</h2>
        <ul>
          <li><NavLink to="/">Home</NavLink></li>
          <li onClick={() => isLogin && setIsOpen(true)}><NavLink to={ !isLogin ? "/myRecipe" : "/"}>My Recipe</NavLink></li>
          <li onClick={() => isLogin && setIsOpen(true)}><NavLink to={ !isLogin ? "/favRecipe" : "/"}>Favourites</NavLink></li>
          <li onClick={() => isLogin && setIsOpen(true)}>
            <NavLink to={isLogin ? "/" : "/chats"}>
              Chats
              {unreadChats > 0 && <span className='chat-badge'>{unreadChats}</span>}
            </NavLink>
          </li>
          {!isLogin && (
            <li><NavLink to={profileUrl}>Profile</NavLink></li>
          )}
          <li onClick={checkLogin} className='login-container'>
            {user?.profilePic && <img src={`${API_BASE_URL}/profiles/${user.profilePic}`} alt='avatar' width={26} height={26} style={{ borderRadius: '50%', marginRight: 6 }} />}
            <p className='login'>{isLogin ? 'Login' : 'Logout'}{user?.username ? ` (${user.username})` : (user?.email ? ` (${user.email})` : '')}</p>
          </li>
        </ul>
      </header>
      {(isOpen) && <Modal onClose={() => setIsOpen(false)}><InputForm setIsOpen={() => setIsOpen(false)} /></Modal>}
    </>
  )
}
