import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function EditRecipe() {
    const [recipeData, setRecipeData] = useState({})
    const navigate = useNavigate()
    const { id } = useParams()

    useEffect(() => {
        const getData = async () => {
            await axios.get(`http://localhost:5000/recipe/${id}`)
                .then(response => {
                    let res = response.data
                    setRecipeData({
                        title: res.title,
                        ingredients: res.ingredients.join(","),
                        instructions: res.instructions,
                        time: res.time
                    })
                })
        }
        getData()
    }, [])

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

        await axios.put(`http://localhost:5000/recipe/${id}`, formData, {
            headers: {
                'authorization': 'bearer ' + localStorage.getItem("token")
            }
        })
            .then(() => navigate("/myRecipe"))
    }

    return (
        <div className='container'>
            <div className='form-page-card'>
                <form className='form' onSubmit={onHandleSubmit}>
                    <div className='form-header'>
                        <div className='form-header-icon'>✏️</div>
                        <h3>Edit Recipe</h3>
                        <p>Update your recipe details below</p>
                    </div>
                    <div className='form-control'>
                        <label>Title</label>
                        <input type="text" className='input' name="title" onChange={onHandleChange} value={recipeData.title || ''} />
                    </div>
                    <div className='form-control'>
                        <label>Cooking Time</label>
                        <input type="text" className='input' name="time" onChange={onHandleChange} value={recipeData.time || ''} />
                    </div>
                    <div className='form-control'>
                        <label>Ingredients</label>
                        <textarea className='input-textarea' name="ingredients" rows="4" onChange={onHandleChange} value={recipeData.ingredients || ''}></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Instructions</label>
                        <textarea className='input-textarea' name="instructions" rows="5" onChange={onHandleChange} value={recipeData.instructions || ''}></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Recipe Image</label>
                        <div className='file-upload-area'>
                            <input type="file" name="file" onChange={onHandleChange} />
                        </div>
                    </div>
                    <button type="submit" className='btn-submit'>💾 Save Changes</button>
                </form>
            </div>
        </div>
    )
}
