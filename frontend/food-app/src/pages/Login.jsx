import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Home from './Home'

export default function Login() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [profilePic, setProfilePic] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [])

  const handleOnSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const endpoint = isSignUp ? "signUp" : "login"

    try {
      const payload = isSignUp ? new FormData() : { email, password }

      if (isSignUp) {
        payload.append("username", username)
        payload.append("email", email)
        payload.append("password", password)
        if (profilePic) {
          payload.append("profilePic", profilePic)
        }
      }

      const res = await axios.post(`http://localhost:5000/${endpoint}`, payload)
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      navigate("/")
    } catch (data) {
      setError(data.response?.data?.message || data.response?.data?.error || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp((current) => !current)
    setError("")
    setProfilePic(null)
  }

  return (
    <div className='login-overlay-page'>
      <div className='login-landing-background' aria-hidden="true">
        <Home />
      </div>

      <div className='login-overlay-backdrop'>
        <button
          type="button"
          className='login-overlay-close'
          onClick={() => navigate("/")}
          aria-label="Close login"
        >
          x
        </button>

        <div className='form-page-card login-overlay-card'>
        <form className='form' onSubmit={handleOnSubmit}>
          <div className='form-header'>
            <div className='form-header-icon'>TN</div>
            <h3>{isSignUp ? "Create Account" : "Welcome Back"}</h3>
            <p>{isSignUp ? "Join our community of food lovers" : "Sign in to continue your culinary journey"}</p>
          </div>

          {error && (
            <div className='error-message'>
              <span className='error-icon'>!</span>
              {error}
            </div>
          )}

          {isSignUp && (
            <div className='form-control'>
              <label>
                <span className='field-icon'>@</span> Username
              </label>
              <input
                type="text"
                className='input'
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className='form-control'>
            <label>
              <span className='field-icon'>@</span> Email
            </label>
            <input
              type="email"
              className='input'
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className='form-control'>
            <label>
              <span className='field-icon'>*</span> Password
            </label>
            <input
              type="password"
              className='input'
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div className='form-control'>
              <label>
                <span className='field-icon'>+</span> Profile Photo
              </label>
              <input
                type="file"
                className='input'
                accept="image/*"
                onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <button
            type="submit"
            className='btn btn-primary'
            disabled={loading}
          >
            {loading ? (
              <>
                <span className='btn-spinner'></span>
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </>
            ) : (
              isSignUp ? "Create Account" : "Sign In"
            )}
          </button>

          <div className='form-footer'>
            <p>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                type="button"
                className='link-btn'
                onClick={toggleMode}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
