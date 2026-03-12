import React, { useEffect, useMemo, useState } from 'react'
import profileImg from '../assets/profile.png'
import food from '../assets/foodRecipe.png'
import { Link, useLoaderData } from 'react-router-dom'
import { api, API_BASE_URL } from '../api'

function md5 (string) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits))
  }
  function addUnsigned(lX, lY) {
    const lX4 = lX & 0x40000000
    const lY4 = lY & 0x40000000
    const lX8 = lX & 0x80000000
    const lY8 = lY & 0x80000000
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff)
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8
      }
    } else {
      return lResult ^ lX8 ^ lY8
    }
  }
  function _F(x, y, z) {
    return (x & y) | (~x & z)
  }
  function _G(x, y, z) {
    return (x & z) | (y & ~z)
  }
  function _H(x, y, z) {
    return x ^ y ^ z
  }
  function _I(x, y, z) {
    return y ^ (x | ~z)
  }
  function _FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function _GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function _HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function _II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  function convertToWordArray(str) {
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
  function wordToHex(lValue) {
    let wordToHexValue = ""
    let wordToHexValueTemp = ""
    let lByte, lCount
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255
      wordToHexValueTemp = "0" + lByte.toString(16)
      wordToHexValue += wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2)
    }
    return wordToHexValue
  }

  const x = convertToWordArray(string)
  let a = 0x67452301
  let b = 0xefcdab89
  let c = 0x98badcfe
  let d = 0x10325476

  for (let k = 0; k < x.length; k += 16) {
    const AA = a
    const BB = b
    const CC = c
    const DD = d
    a = _FF(a, b, c, d, x[k + 0], 7, 0xd76aa478)
    d = _FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756)
    c = _FF(c, d, a, b, x[k + 2], 17, 0x242070db)
    b = _FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee)
    a = _FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf)
    d = _FF(d, a, b, c, x[k + 5], 12, 0x4787c62a)
    c = _FF(c, d, a, b, x[k + 6], 17, 0xa8304613)
    b = _FF(b, c, d, a, x[k + 7], 22, 0xfd469501)
    a = _FF(a, b, c, d, x[k + 8], 7, 0x698098d8)
    d = _FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af)
    c = _FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1)
    b = _FF(b, c, d, a, x[k + 11], 22, 0x895cd7be)
    a = _FF(a, b, c, d, x[k + 12], 7, 0x6b901122)
    d = _FF(d, a, b, c, x[k + 13], 12, 0xfd987193)
    c = _FF(c, d, a, b, x[k + 14], 17, 0xa679438e)
    b = _FF(b, c, d, a, x[k + 15], 22, 0x49b40821)
    a = _GG(a, b, c, d, x[k + 1], 5, 0xf61e2562)
    d = _GG(d, a, b, c, x[k + 6], 9, 0xc040b340)
    c = _GG(c, d, a, b, x[k + 11], 14, 0x265e5a51)
    b = _GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa)
    a = _GG(a, b, c, d, x[k + 5], 5, 0xd62f105d)
    d = _GG(d, a, b, c, x[k + 10], 9, 0x02441453)
    c = _GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681)
    b = _GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8)
    a = _GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6)
    d = _GG(d, a, b, c, x[k + 14], 9, 0xc33707d6)
    c = _GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87)
    b = _GG(b, c, d, a, x[k + 8], 20, 0x455a14ed)
    a = _GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905)
    d = _GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8)
    c = _GG(c, d, a, b, x[k + 7], 14, 0x676f02d9)
    b = _GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a)
    a = _HH(a, b, c, d, x[k + 5], 4, 0xfffa3942)
    d = _HH(d, a, b, c, x[k + 8], 11, 0x8771f681)
    c = _HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122)
    b = _HH(b, c, d, a, x[k + 14], 23, 0xfde5380c)
    a = _HH(a, b, c, d, x[k + 1], 4, 0xa4beea44)
    d = _HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9)
    c = _HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60)
    b = _HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70)
    a = _HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6)
    d = _HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa)
    c = _HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085)
    b = _HH(b, c, d, a, x[k + 6], 23, 0x04881d05)
    a = _HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039)
    d = _HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5)
    c = _HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8)
    b = _HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665)
    a = _II(a, b, c, d, x[k + 0], 6, 0xf4292244)
    d = _II(d, a, b, c, x[k + 7], 10, 0x432aff97)
    c = _II(c, d, a, b, x[k + 14], 15, 0xab9423a7)
    b = _II(b, c, d, a, x[k + 5], 21, 0xfc93a039)
    a = _II(a, b, c, d, x[k + 12], 6, 0x655b59c3)
    d = _II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92)
    c = _II(c, d, a, b, x[k + 10], 15, 0xffeff47d)
    b = _II(b, c, d, a, x[k + 1], 21, 0x85845dd1)
    a = _II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f)
    d = _II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0)
    c = _II(c, d, a, b, x[k + 6], 15, 0xa3014314)
    b = _II(b, c, d, a, x[k + 13], 21, 0x4e0811a1)
    a = _II(a, b, c, d, x[k + 4], 6, 0xf7537e82)
    d = _II(d, a, b, c, x[k + 11], 10, 0xbd3af235)
    c = _II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb)
    b = _II(b, c, d, a, x[k + 9], 21, 0xeb86d391)
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
  if (!email) return profileImg
  const hash = md5(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=64`
}

export default function RecipeDetails() {
    const loaderData = useLoaderData()
    const [recipe, setRecipe] = useState(loaderData)
    const [commentText, setCommentText] = useState("")
    const [ratingValue, setRatingValue] = useState(0)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const token = localStorage.getItem("token")
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") ?? "null")
        } catch {
            return null
        }
    }, [])

    useEffect(() => {
        setRecipe(loaderData)
    }, [loaderData])

    const averageRating = recipe?.avgRating ?? 0
    const ratingCount = recipe?.ratings?.length ?? 0
    const userRating = recipe?.ratings?.find(r => String(r.user) === user?._id)?.value

    useEffect(() => {
        if (userRating) {
            setRatingValue(userRating)
        }
    }, [userRating])

    const submitFeedback = async (event) => {
        event.preventDefault()
        setError("")
        setSuccess("")

        if (!token) {
            setError("Please login to add a comment or rating")
            return
        }

        try {
            let updated = recipe

            if (ratingValue && ratingValue >= 1 && ratingValue <= 5) {
                const res = await api.post(
                    `/recipe/${recipe._id}/rate`,
                    { value: ratingValue },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                updated = res.data
            }

            if (commentText.trim()) {
                const res = await api.post(
                    `/recipe/${recipe._id}/comment`,
                    { text: commentText.trim() },
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                updated = res.data
            }

            setRecipe(updated)
            setSuccess("Feedback saved successfully")
            setCommentText("")
        }
        catch (err) {
            setError(err.response?.data?.message || "Something went wrong")
        }
    }

    const deleteComment = async (commentId) => {
        if (!token) {
            setError("Please login to delete comments")
            return
        }

        try {
const res = await api.delete(
            `/recipe/${recipe._id}/comment/${commentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setRecipe(res.data)
            setSuccess("Comment deleted")
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete comment")
        }
    }

    return (
        <>
            <div className='outer-container'>
                <div className='profile'>
                    <img
                        src={getAvatarUrl(recipe.creatorProfilePic, recipe.creatorEmail)}
                        width="50px"
                        height="50px"
                        alt='creator'
                        style={{ borderRadius: '50%' }}
                    />
                    {recipe.creatorId ? (
                        <Link
                          to={`/profile/${recipe.creatorUsername || recipe.creatorId}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <h5>{recipe.creatorUsername || recipe.creatorEmail || 'Unknown'}</h5>
                        </Link>
                    ) : (
                        <h5>{recipe.creatorUsername || recipe.creatorEmail || 'Unknown'}</h5>
                    )}
                </div>
                <h3 className='title'>{recipe.title}</h3>
                <img src={`${API_BASE_URL}/images/${recipe.coverImage}`} width="220px" height="200px"></img>

                <div className='rating-summary'>
                    <strong>Rating:</strong> {averageRating} / 5 ({ratingCount} {ratingCount === 1 ? 'vote' : 'votes'})
                    {user && userRating ? <span> • Your rating: {userRating}</span> : null}
                </div>

                <div className='recipe-details'>
                    <div className='ingredients'><h4>Ingredients</h4><ul>{recipe.ingredients.map((item, idx) => (<li key={idx}>{item}</li>))}</ul></div>
                    <div className='instructions'><h4>Instructions</h4><span>{recipe.instructions}</span></div>
                </div>

                <div className='feedback'>
                    <h4>Add your rating & comment</h4>
                    <form onSubmit={submitFeedback} className='feedback-form'>
                        <div className='form-row'>
                            <label>Rating</label>
                            <div className='star-picker'>
                                {[1, 2, 3, 4, 5].map((v) => (
                                    <span
                                        key={v}
                                        className={`star ${v <= ratingValue ? 'filled' : ''}`}
                                        onClick={() => setRatingValue(v)}
                                        role='button'
                                        aria-label={`${v} star${v > 1 ? 's' : ''}`}
                                        style={{
                                            cursor: 'pointer',
                                            fontSize: '1.3rem',
                                            color: v <= ratingValue ? '#ffb400' : '#ccc',
                                            marginRight: 4
                                        }}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className='form-row'>
                            <small style={{ opacity: 0.75 }}>
                                Tip: You can submit a rating only, a comment only, or both.
                            </small>
                        </div>
                        <div className='form-row'>
                            <label>Comment</label>
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Share what you liked about this recipe..."
                                rows={3}
                            />
                        </div>
                        <button type='submit'>Submit</button>
                        {error && <div className='error'>{error}</div>}
                        {success && <div className='success'>{success}</div>}
                    </form>

                    <div className='comments'>
                        <h4>Comments</h4>
                        {recipe.comments?.length ? (
                            recipe.comments.slice().reverse().map((comment) => (
                                <div key={comment._id || comment.createdAt} className='comment'>
                                    <div className='comment-header'>
                                        <div className='comment-meta'>
                                            <img
                                                src={getAvatarUrl(comment.profilePic, comment.email)}
                                                alt='avatar'
                                                width={32}
                                                height={32}
                                                style={{ borderRadius: '50%', marginRight: 8 }}
                                            />
                                            <div>
                                                <strong>{comment.username || comment.email || 'Anonymous'}</strong>
                                                <div style={{ fontSize: '0.8rem', color: '#555' }}>
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        {String(comment.user) === user?._id ? (
                                            <button
                                                type='button'
                                                className='delete-comment'
                                                onClick={() => deleteComment(comment._id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#c00',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        ) : null}
                                    </div>
                                    <div className='comment-body'>{comment.text}</div>
                                </div>
                            ))
                        ) : (
                            <div className='no-comments'>No comments yet. Be the first to comment!</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
