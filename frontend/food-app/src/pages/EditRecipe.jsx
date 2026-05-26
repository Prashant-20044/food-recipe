import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const initialForm = {
    title: '',
    time: '',
    category: '',
    ingredients: '',
    instructions: '',
    file: null
}

export default function EditRecipe() {
    const [recipeData, setRecipeData] = useState(initialForm)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const navigate = useNavigate()
    const { id } = useParams()

    useEffect(() => {
        let cancelled = false

        const getData = async () => {
            setLoading(true)
            setError('')

            try {
                const response = await api.get(`/recipe/${id}`)
                const recipe = response.data

                if (cancelled) return

                setRecipeData({
                    title: recipe.title || '',
                    time: recipe.time || '',
                    category: recipe.category || '',
                    ingredients: Array.isArray(recipe.ingredients)
                        ? recipe.ingredients.join(', ')
                        : recipe.ingredients || '',
                    instructions: recipe.instructions || '',
                    file: null
                })
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || 'Failed to load recipe')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        getData()

        return () => {
            cancelled = true
        }
    }, [id])

    const onHandleChange = (e) => {
        const { name, value, files } = e.target
        setRecipeData((prev) => ({
            ...prev,
            [name]: name === 'file' ? files?.[0] || null : value
        }))
    }

    const onHandleSubmit = async (e) => {
        e.preventDefault()

        const token = localStorage.getItem('token')
        if (!token) {
            setError('Please log in again before editing this recipe.')
            return
        }

        setSaving(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('title', recipeData.title.trim())
            formData.append('time', recipeData.time.trim())
            formData.append('category', recipeData.category.trim())
            formData.append('ingredients', recipeData.ingredients.trim())
            formData.append('instructions', recipeData.instructions.trim())

            if (recipeData.file) {
                formData.append('file', recipeData.file)
            }

            await api.put(`/recipe/${id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            navigate('/myRecipe')
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save recipe changes')
            setSaving(false)
        }
    }

    return (
        <div className='container'>
            <div className='form-page-card'>
                {loading ? (
                    <div className='profile-state'>Loading recipe...</div>
                ) : (
                    <>
                        {error && <div className='chat-inline-error'>{error}</div>}

                        <form className='form' onSubmit={onHandleSubmit}>
                            <div className='form-header'>
                                <h3>Edit Recipe</h3>
                                <p>Update your recipe details below</p>
                            </div>

                            <div className='form-control'>
                                <label>Title</label>
                                <input
                                    type='text'
                                    className='input'
                                    name='title'
                                    onChange={onHandleChange}
                                    value={recipeData.title}
                                    required
                                />
                            </div>

                            <div className='form-control'>
                                <label>Cooking Time</label>
                                <input
                                    type='text'
                                    className='input'
                                    name='time'
                                    onChange={onHandleChange}
                                    value={recipeData.time}
                                />
                            </div>

                            <div className='form-control'>
                                <label>Category</label>
                                <input
                                    type='text'
                                    className='input'
                                    name='category'
                                    onChange={onHandleChange}
                                    value={recipeData.category}
                                    required
                                />
                            </div>

                            <div className='form-control'>
                                <label>Ingredients</label>
                                <textarea
                                    className='input-textarea'
                                    name='ingredients'
                                    rows='4'
                                    onChange={onHandleChange}
                                    value={recipeData.ingredients}
                                    required
                                />
                            </div>

                            <div className='form-control'>
                                <label>Instructions</label>
                                <textarea
                                    className='input-textarea'
                                    name='instructions'
                                    rows='5'
                                    onChange={onHandleChange}
                                    value={recipeData.instructions}
                                    required
                                />
                            </div>

                            <div className='form-control'>
                                <label>Recipe Image</label>
                                <div className='file-upload-area'>
                                    <input type='file' name='file' accept='image/*' onChange={onHandleChange} />
                                </div>
                            </div>

                            <button type='submit' className='btn-submit' disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
