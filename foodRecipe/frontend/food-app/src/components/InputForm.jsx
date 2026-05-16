import React, { useState } from 'react'
import axios from 'axios'

export default function InputForm({ setIsOpen }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")

  const handleOnSubmit = async (e) => {
    e.preventDefault()
    let endpoint = (isSignUp) ? "signUp" : "login"
    await axios.post(`http://localhost:5000/${endpoint}`, { email, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("user", JSON.stringify(res.data.user))
        setIsOpen()
      })
      .catch(data => setError(data.response?.data?.error))
  }

  return (
    <form className='login-form' onSubmit={handleOnSubmit}>
      <div className='login-form-header'>
        <h3>{isSignUp ? "Create Account" : "Welcome Back"}</h3>
        <p>{isSignUp ? "Join our community of food lovers" : "Sign in to continue your culinary journey"}</p>
      </div>

      <div className='login-field'>
        <label htmlFor="login-email">
          <span className='login-field-icon'>✉️</span> Email
        </label>
        <input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className='login-field'>
        <label htmlFor="login-password">
          <span className='login-field-icon'>🔒</span> Password
        </label>
        <input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {(error !== "") && (
        <div className='login-error'>
          <span>⚠️</span> {error}
        </div>
      )}

      <button type='submit' className='login-btn'>
        {(isSignUp) ? "🚀 Create Account" : "🍽️ Sign In"}
      </button>

      <div className='login-divider'>
        <span>or</span>
      </div>

      <p className='login-toggle' onClick={() => setIsSignUp(pre => !pre)}>
        {(isSignUp) ? "Already have an account? " : "Don't have an account? "}
        <strong>{isSignUp ? "Sign In" : "Sign Up"}</strong>
      </p>
    </form>
  )
}
