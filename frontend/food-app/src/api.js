import axios from 'axios'

export const API_BASE_URL = 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

export const getProfileImageUrl = (user) => {
  if (user?.profilePic) {
    return `${API_BASE_URL}/profiles/${user.profilePic}`
  }

  const label = (user?.username || user?.email || 'U').trim().slice(0, 2).toUpperCase()
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="#E85D26"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Arial, sans-serif" font-size="46" font-weight="700">${label}</text>
    </svg>
  `
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
