import React, { useState } from 'react'
import { api } from '../api'

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

        try {
            let res
            if (isSignUp) {
                const formData = new FormData()
                formData.append("username", username)
                formData.append("email", email)
                formData.append("password", password)
                if (profilePic) {
                    formData.append("profilePic", profilePic)
                }

                res = await api.post(`/${endpoint}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                })
            } else {
                res = await api.post(`/${endpoint}`, { email, password })
            }

            localStorage.setItem("token", res.data.token)
            localStorage.setItem("user", JSON.stringify(res.data.user))
            setIsOpen()
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || "Something went wrong")
        }
    }

    return (
        <>
            <form className='form' onSubmit={handleOnSubmit}>
                {isSignUp && (
                    <>
                        <div className='form-control'>
                            <label>Username</label>
                            <input type='text' className='input' value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className='form-control'>
                            <label>Profile photo</label>
                            <input type='file' accept='image/*' className='input' onChange={(e) => setProfilePic(e.target.files[0])} required />
                        </div>
                    </>
                )}

                <div className='form-control'>
                    <label>Email</label>
                    <input type='email' className='input' value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className='form-control'>
                    <label>Password</label>
                    <input type='password' className='input' value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type='submit'>{isSignUp ? "Sign Up" : "Login"}</button><br></br>
                {error && <h6 className='error'>{error}</h6>}<br></br>
                <p onClick={() => setIsSignUp((pre) => !pre)}>{isSignUp ? "Already have an account" : "Create new account"}</p>
            </form>
        </>
    )
}
