import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  let token = localStorage.getItem("token")
  const [isLogin, setIsLogin] = useState(token ? false : true)
  let user = JSON.parse(localStorage.getItem("user"))
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setIsLogin(token ? false : true)
  }, [token])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const checkLogin = () => {
    if (token) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setIsLogin(true)
    } else {
      navigate("/login")
    }
  }

  return (
    <>
      <header className={scrolled ? 'scrolled' : ''}>
        <h2>🍳 TasteNest</h2>
        <ul>
          <li><NavLink to="/">Home</NavLink></li>
          <li onClick={() => isLogin && navigate("/login")}><NavLink to={!isLogin ? "/myRecipe" : "/"}>My Recipes</NavLink></li>
          <li onClick={() => isLogin && navigate("/favRecipe")}><NavLink to={!isLogin ? "/favRecipe" : "/"}>Favourites</NavLink></li>
          <li onClick={checkLogin}>
            <p className='login'>
              {(isLogin) ? "Login" : "Logout"}
              {user?.email ? ` (${user?.email})` : ""}
            </p>
          </li>
        </ul>
      </header>
    </>
  )
}
