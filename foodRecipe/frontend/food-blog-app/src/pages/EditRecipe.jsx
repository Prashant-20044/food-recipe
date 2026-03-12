import { api } from '../api'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function EditRecipe() {
    const [recipeData, setRecipeData] = useState({})
    const navigate = useNavigate()
    const{id}=useParams()

    const categories = [
        "Quick & Easy",
        "Most Popular",
        "Healthy",
        "Spring",
        "Dessert",
        "Quick Dinner",
        "Vegan"
    ]

    useEffect(()=>{
        const getData=async()=>{
            await api.get(`/recipe/${id}`)
            .then(response=>{
                let res=response.data
                setRecipeData({
                    title:res.title,
                    category: res.category,
                    ingredients:res.ingredients.join(","),
                    instructions:res.instructions,
                    time:res.time
                })
            })
        }
        getData()
    },[])

    const onHandleChange = (e) => {
        let val = (e.target.name === "ingredients") ? e.target.value.split(",") : (e.target.name === "file") ? e.target.files[0] : e.target.value
        setRecipeData(pre => ({ ...pre, [e.target.name]: val }))
    }
    const onHandleSubmit = async (e) => {
        e.preventDefault()
        console.log(recipeData)

        const formData = new FormData()
        Object.entries(recipeData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value)
            }
        })

        await api.put(`/recipe/${id}`, formData, {
            headers: {
                'authorization': 'bearer ' + localStorage.getItem("token")
            }
        })
            .then(() => navigate("/myRecipe"))
    }
    return (
        <>
            <div className='container'>
                <form className='form' onSubmit={onHandleSubmit}>
                    <div className='form-control'>
                        <label>Title</label>
                        <input type="text" className='input' name="title" onChange={onHandleChange} value={recipeData.title}></input>
                    </div>
                    <div className='form-control'>
                        <label>Category</label>
                        <select className='input' name='category' onChange={onHandleChange} value={recipeData.category || ""} required>
                            <option value="">Select a category</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className='form-control'>
                        <label>Time</label>
                        <input type="text" className='input' name="time" onChange={onHandleChange} value={recipeData.time}></input>
                    </div>
                    <div className='form-control'>
                        <label>Ingredients</label>
                        <textarea type="text" className='input-textarea' name="ingredients" rows="5" onChange={onHandleChange} value={recipeData.ingredients}></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Instructions</label>
                        <textarea type="text" className='input-textarea' name="instructions" rows="5" onChange={onHandleChange} value={recipeData.instructions}></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Recipe Image</label>
                        <input type="file" className='input' name="file" onChange={onHandleChange}></input>
                    </div>
                    <button type="submit">Edit Recipe</button>
                </form>
            </div>
        </>
    )
}
