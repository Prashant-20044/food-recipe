import React, { useState } from 'react'
import axios from 'axios'

export default function InputForm({ setIsOpen }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [profilePic, setProfilePic] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")

  const handleOnSubmit = async (e) => {
    e.preventDefault()
    const endpoint = isSignUp ? "signUp" : "login"
    const payload = isSignUp ? new FormData() : { email, password }

    if (isSignUp) {
      payload.append("username", username)
      payload.append("email", email)
      payload.append("password", password)
      if (profilePic) {
        payload.append("profilePic", profilePic)
      }
    }

    await axios.post(`http://localhost:5000/${endpoint}`, payload)
      .then((res) => {
        localStorage.setItem("token", res.data.token)
        localStorage.setItem("user", JSON.stringify(res.data.user))
        setIsOpen()
      })
      .catch(data => setError(data.response?.data?.message || data.response?.data?.error || "An error occurred"))
  }

  const toggleMode = () => {
    setIsSignUp((current) => !current)
    setError("")
    setProfilePic(null)
  }

  return (
    <form className='login-form' onSubmit={handleOnSubmit}>
      <div className='login-form-header'>
        <h3>{isSignUp ? "Create Account" : "Welcome Back"}</h3>
        <p>{isSignUp ? "Join our community of food lovers" : "Sign in to continue your culinary journey"}</p>
      </div>

      {isSignUp && (
        <div className='login-field'>
          <label htmlFor="login-username">
            <span className='login-field-icon'>@</span> Username
          </label>
          <input
            id="login-username"
            type="text"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      )}

      <div className='login-field'>
        <label htmlFor="login-email">
          <span className='login-field-icon'>@</span> Email
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
          <span className='login-field-icon'>*</span> Password
        </label>
        <input
          id="login-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {isSignUp && (
        <div className='login-field'>
          <label htmlFor="login-profile-pic">
            <span className='login-field-icon'>+</span> Profile Photo
          </label>
          <input
            id="login-profile-pic"
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
          />
        </div>
      )}

      {(error !== "") && (
        <div className='login-error'>
          <span>!</span> {error}
        </div>
      )}

      <button type='submit' className='login-btn'>
        {isSignUp ? "Create Account" : "Sign In"}
      </button>

      <div className='login-divider'>
        <span>or</span>
      </div>

      <p className='login-toggle' onClick={toggleMode}>
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <strong>{isSignUp ? "Sign In" : "Sign Up"}</strong>
      </p>
    </form>
  )
}
