import React, { useMemo } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { api, API_BASE_URL } from '../api'

const md5 = (string) => {
  const rotateLeft = (lValue, iShiftBits) => (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits))
  const addUnsigned = (lX, lY) => {
    const lX4 = lX & 0x40000000
    const lY4 = lY & 0x40000000
    const lX8 = lX & 0x80000000
    const lY8 = lY & 0x80000000
    let lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff)
    if (lX4 & lY4) {
      lResult ^= 0x80000000 ^ lX8 ^ lY8
    } else if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        lResult ^= 0xc0000000 ^ lX8 ^ lY8
      } else {
        lResult ^= 0x40000000 ^ lX8 ^ lY8
      }
    } else {
      lResult ^= lX8 ^ lY8
    }
    return lResult
  }
  const convertToWordArray = (str) => {
    const lWordCount = []
    let lMessageLength = str.length
    let lNumberOfWordsTemp1 = lMessageLength + 8
    const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16
    let lBytePosition = 0
    let lByteCount = 0
    while (lByteCount < lMessageLength) {
      const lWordCountIndex = (lByteCount - (lByteCount % 4)) / 4
      lWordCount[lWordCountIndex] = lWordCount[lWordCountIndex] || 0
      lWordCount[lWordCountIndex] |= (str.charCodeAt(lByteCount) << ((lByteCount % 4) * 8))
      lByteCount++
    }
    const lWordCountIndex = (lByteCount - (lByteCount % 4)) / 4
    lWordCount[lWordCountIndex] = lWordCount[lWordCountIndex] || 0
    lWordCount[lWordCountIndex] |= (0x80 << ((lByteCount % 4) * 8))
    lWordCount[lNumberOfWords - 2] = lMessageLength << 3
    lWordCount[lNumberOfWords - 1] = lMessageLength >>> 29
    return lWordCount
  }
  const wordToHex = (lValue) => {
    let wordToHexValue = ""
    let lByte, lCount
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255
      const wordToHexValueTemp = "0" + lByte.toString(16)
      wordToHexValue += wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2)
    }
    return wordToHexValue
  }

  let x = convertToWordArray(string)
  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476

  for (let k = 0; k < x.length; k += 16) {
    const AA = a
    const BB = b
    const CC = c
    const DD = d
    const FF = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(addUnsigned((b & c) | (~b & d), x), ac), a), s), b)
    const GG = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(addUnsigned((b & d) | (c & ~d), x), ac), a), s), b)
    const HH = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(addUnsigned(b ^ c ^ d, x), ac), a), s), b)
    const II = (a, b, c, d, x, s, ac) => addUnsigned(rotateLeft(addUnsigned(addUnsigned(addUnsigned(c ^ (b | ~d), x), ac), a), s), b)

    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478)
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756)
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db)
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee)
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf)
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a)
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613)
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501)
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8)
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af)
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1)
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be)
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122)
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193)
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e)
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821)
    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562)
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340)
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51)
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa)
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d)
    d = GG(d, a, b, c, x[k + 10], 9, 0x02441453)
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681)
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8)
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde)
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6)
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87)
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed)
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905)
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8)
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9)
    b = GG(b, c, d, a, x[k + 12], 20, 0x8b44f7af)
    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942)
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681)
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9c6a6)
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c)
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44)
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa4)
    c = HH(c, d, a, b, x[k + 7], 16, 0x6f6f7fb)
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbe0)
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec)
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127e)
    c = HH(c, d, a, b, x[k + 3], 16, 0xf6b9c33)
    b = HH(b, c, d, a, x[k + 6], 23, 0x04881d05)
    a = HH(a, b, c, d, x[k + 9], 4, 0xfe2ce6b)
    d = HH(d, a, b, c, x[k + 12], 11, 0x0bc2f6e)
    c = HH(c, d, a, b, x[k + 15], 16, 0x6a9c58e)
    b = HH(b, c, d, a, x[k + 2], 23, 0x0cf9c5c)
    a = II(a, b, c, d, x[k + 0], 6, 0x655b59c)
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97)
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7)
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039)
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c)
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92)
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d)
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1)
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4)
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6b)
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314)
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1)
    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase()
}

const getAvatarUrl = (profilePic, email) => {
  if (profilePic) {
    return `${API_BASE_URL}/profiles/${profilePic}`
  }
  if (!email) return ""
  const hash = md5(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=64`
}

export async function loader({ params }) {
  const identifier = params.identifier
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier)

  const userUrl = isObjectId
    ? `/user/${identifier}`
    : `/user/username/${encodeURIComponent(identifier)}`

  const userRes = await api.get(userUrl)
  const userId = userRes.data._id

  const recipesRes = await api.get(`/recipe/user/${userId}`)

  return {
    user: userRes.data,
    recipes: recipesRes.data
  }
}

export default function Profile() {
  const { user, recipes } = useLoaderData()
  const navigate = useNavigate()

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') ?? 'null')
    } catch {
      return null
    }
  }, [])

  const canMessage = currentUser && currentUser._id !== user._id

  return (
    <div className='profile-page'>
      <div className='profile-header'>
        <img
          src={getAvatarUrl(user.profilePic, user.email)}
          alt={user.username}
          width={90}
          height={90}
          style={{ borderRadius: '50%' }}
        />
        <div className='profile-info'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2>{user.username}</h2>
            <button
              style={{
                background: 'transparent',
                border: '1px solid rgba(33,53,71,0.3)',
                borderRadius: '999px',
                padding: '0.25rem 0.75rem',
                cursor: 'pointer',
              }}
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
          <p>{user.email}</p>
          {canMessage ? (
            <button onClick={() => navigate(`/chat/${user._id}`)}>Message</button>
          ) : null}
        </div>
      </div>

      <div className='profile-recipes'>
        <h3>{recipes?.length ? "Recipes by this user" : "No recipes found"}</h3>
        <div className='card-row'>
          {recipes?.map((recipe) => (
            <div key={recipe._id} className='card' onDoubleClick={() => navigate(`/recipe/${recipe._id}`)}>
              <img
                src={recipe.coverImage ? `${API_BASE_URL}/images/${recipe.coverImage}` : ''}
                width="120px"
                height="100px"
                alt={recipe.title}
              />
              <div className='card-body'>
                <div className='title'>{recipe.title}</div>
                <div className='category-badge'>{recipe.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
