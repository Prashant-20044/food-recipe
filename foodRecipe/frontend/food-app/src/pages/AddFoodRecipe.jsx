import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AddFoodRecipe() {
    const [recipeData, setRecipeData] = useState({})
    const navigate = useNavigate()

    const onHandleChange = (e) => {
        let val = (e.target.name === "ingredients") ? e.target.value.split(",") : (e.target.name === "file") ? e.target.files[0] : e.target.value
        setRecipeData(pre => ({ ...pre, [e.target.name]: val }))
    }

    const onHandleSubmit = async (e) => {
        e.preventDefault()
        const formData = new FormData()
        Object.entries(recipeData).forEach(([key, value]) => {
            if (key === 'ingredients' && Array.isArray(value)) {
                value = value.join(',')
            }
            if (value !== undefined) {
                formData.append(key, value)
            }
        })

        await axios.post("http://localhost:5000/recipe", formData, {
            headers: {
                'authorization': 'bearer ' + localStorage.getItem("token")
            }
        })
            .then(() => navigate("/"))
    }

    return (
        <div className='container'>
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
                        <label>Ingredients</label>
                        <textarea className='input-textarea' name="ingredients" rows="4" placeholder="Separate ingredients with commas..." onChange={onHandleChange} required></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Instructions</label>
                        <textarea className='input-textarea' name="instructions" rows="5" placeholder="Step by step cooking instructions..." onChange={onHandleChange} required></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Recipe Image</label>
                        <div className='file-upload-area'>
                            <input type="file" name="file" onChange={onHandleChange} />
                        </div>
                    </div>
                    <button type="submit" className='btn-submit'>🚀 Publish Recipe</button>
                </form>
            </div>
        </div>
    )
}
