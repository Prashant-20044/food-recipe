import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AddFoodRecipe() {
    const [recipeData, setRecipeData] = useState({})
    const [imagePreview, setImagePreview] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview)
            }
        }
    }, [imagePreview])

    const onHandleChange = (e) => {
        let val = (e.target.name === "ingredients") ? e.target.value.split(",") : (e.target.name === "file") ? e.target.files[0] : e.target.value
        if (e.target.name === "file" && val) {
            setImagePreview(URL.createObjectURL(val))
        }
        setRecipeData(pre => ({ ...pre, [e.target.name]: val }))
    }

    const onHandleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const token = localStorage.getItem("token")
        if (!token) {
            navigate("/login")
            return
        }

        setLoading(true)
        const formData = new FormData()
        Object.entries(recipeData).forEach(([key, value]) => {
            if (key === 'ingredients' && Array.isArray(value)) {
                value = value.join(',')
            }
            if (value !== undefined) {
                formData.append(key, value)
            }
        })

        try {
            await axios.post("http://localhost:5000/recipe", formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || "Unable to publish recipe")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='container recipe-form-shell'>
            <div className='form-page-card'>
                <form className='form' onSubmit={onHandleSubmit}>
                    <div className='form-header'>
                        <div className='form-header-icon'>📝</div>
                        <h3>Add New Recipe</h3>
                        <p>Share your culinary masterpiece with the world</p>
                    </div>
                    <div className='form-control'>
                        <label>Title</label>
                        <input type="text" className='input' name="title" placeholder="e.g. Grandma's Pasta" onChange={onHandleChange} required />
                    </div>
                    <div className='form-control'>
                        <label>Cooking Time</label>
                        <input type="text" className='input' name="time" placeholder="e.g. 30 mins" onChange={onHandleChange} required />
                    </div>
                    <div className='form-control'>
                        <label>Category</label>
                        <input type="text" className='input' name="category" placeholder="e.g. Italian, Dessert, Breakfast" onChange={onHandleChange} required />
                    </div>
                    <div className='form-control'>
                        <label>Ingredients</label>
                        <textarea className='input-textarea' name="ingredients" rows="4" placeholder="Separate ingredients with commas..." onChange={onHandleChange} required></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Instructions</label>
                        <textarea className='input-textarea' name="instructions" rows="5" placeholder="Step by step cooking instructions..." onChange={onHandleChange} required></textarea>
                    </div>
                    <div className='form-control'>
                        <label htmlFor="recipe-image">Recipe Image</label>
                        <label
                            className={`file-upload-area recipe-image-upload ${imagePreview ? 'has-preview' : ''}`}
                            htmlFor="recipe-image"
                        >
                            <input
                                id="recipe-image"
                                type="file"
                                name="file"
                                accept="image/*"
                                onChange={onHandleChange}
                            />
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Selected recipe preview" />
                                    <span className='upload-change-badge'>Change image</span>
                                </>
                            ) : (
                                <span className='upload-placeholder'>
                                    <span className='upload-icon'>+</span>
                                    <span className='upload-title'>Add a delicious cover photo</span>
                                    <span className='upload-copy'>Choose a clear image that shows the finished dish.</span>
                                </span>
                            )}
                        </label>
                    </div>
                    {error && <div className='error-message'><span className='error-icon'>!</span>{error}</div>}
                    <button type="submit" className='btn-submit' disabled={loading}>
                        {loading ? "Publishing..." : "Publish Recipe"}
                    </button>
                </form>
            </div>
        </div>
    )
}
