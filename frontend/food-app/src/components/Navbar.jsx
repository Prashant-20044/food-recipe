import React, { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getProfileImageUrl } from '../api'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  let token = localStorage.getItem("token")
  const [isLogin, setIsLogin] = useState(token ? false : true)
  let user = JSON.parse(localStorage.getItem("user"))
  const [scrolled, setScrolled] = useState(false)
  const needsSolidNav = location.pathname.startsWith('/profile') || location.pathname.startsWith('/messages')

  useEffect(() => {
    setIsLogin(token ? false : true)
  }, [token])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const checkLogin = () => {
    navigate("/login")
  }

  return (
    <>
      <header className={`${scrolled ? 'scrolled' : ''} ${needsSolidNav ? 'profile-nav' : ''}`.trim()}>
        <h2>🍳 TasteNest</h2>
        <ul>
          <li><NavLink to="/">Home</NavLink></li>
          <li onClick={() => isLogin && navigate("/login")}><NavLink to={!isLogin ? "/myRecipe" : "/"}>My Recipes</NavLink></li>
          <li onClick={() => isLogin && navigate("/favRecipe")}><NavLink to={!isLogin ? "/favRecipe" : "/"}>Favourites</NavLink></li>
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
