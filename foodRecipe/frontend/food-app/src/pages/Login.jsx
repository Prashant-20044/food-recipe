import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleOnSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    let endpoint = (isSignUp) ? "signUp" : "login"
    try {
      const res = await axios.post(`http://localhost:5000/${endpoint}`, { email, password })
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      navigate("/")
    } catch (data) {
      setError(data.response?.data?.error || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container'>
      <div className='form-page-card'>
        <form className='form' onSubmit={handleOnSubmit}>
          <div className='form-header'>
            <div className='form-header-icon'>🍳</div>
            <h3>{isSignUp ? "Create Account" : "Welcome Back"}</h3>
            <p>{isSignUp ? "Join our community of food lovers" : "Sign in to continue your culinary journey"}</p>
          </div>

          {error && (
            <div className='error-message'>
              <span className='error-icon'>⚠️</span>
              {error}
            </div>
          )}

          <div className='form-control'>
            <label>
              <span className='field-icon'>✉️</span> Email
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
              <span className='field-icon'>🔒</span> Password
            </label>
            <input
              type="password"
              className='input'
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

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
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError("")
                }}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}