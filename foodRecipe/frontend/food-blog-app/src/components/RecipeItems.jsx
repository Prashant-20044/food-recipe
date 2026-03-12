import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import foodImg from '../assets/foodRecipe.png'
import { BsStopwatchFill } from "react-icons/bs";
import { FaHeart } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { api, API_BASE_URL } from '../api'

export default function RecipeItems() {
    const recipes = useLoaderData()
    const [allRecipes, setAllRecipes] = useState()
    const [selectedCategory, setSelectedCategory] = useState('All')
    let path = window.location.pathname === "/myRecipe" ? true : false
    let favItems = JSON.parse(localStorage.getItem("fav")) ?? []
    const [isFavRecipe, setIsFavRecipe] = useState(false)
    const navigate = useNavigate()

    const categories = useMemo(() => {
        if (!allRecipes) return ['All']
        const unique = Array.from(new Set(allRecipes.map(r => r.category || 'Uncategorized')))
        return ['All', ...unique]
    }, [allRecipes])

    const filteredRecipes = useMemo(() => {
        if (!allRecipes) return []
        if (selectedCategory === 'All') return allRecipes
        return allRecipes.filter(r => (r.category || 'Uncategorized') === selectedCategory)
    }, [allRecipes, selectedCategory])

    useEffect(() => {
        setAllRecipes(recipes)
    }, [recipes])

    const onDelete = async (id) => {
        await api.delete(`/recipe/${id}`)
            .then((res) => console.log(res))
        setAllRecipes(recipes => recipes.filter(recipe => recipe._id !== id))
        let filterItem = favItems.filter(recipe => recipe._id !== id)
        localStorage.setItem("fav", JSON.stringify(filterItem))
    }

    const favRecipe = (item) => {
        let filterItem = favItems.filter(recipe => recipe._id !== item._id)
        favItems = favItems.filter(recipe => recipe._id === item._id).length === 0 ? [...favItems, item] : filterItem
        localStorage.setItem("fav", JSON.stringify(favItems))
        setIsFavRecipe(pre => !pre)
    }

    return (
        <>
            <div className='category-filter'>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`category-pill ${cat === selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className='card-container'>
                {
                    filteredRecipes?.map((item, index) => {
                        return (
                            <div key={index} className='card' onDoubleClick={() => navigate(`/recipe/${item._id}`)}>
                                <img
                                    src={item.coverImage ? `${API_BASE_URL}/images/${item.coverImage}` : foodImg}
                                    width="120px"
                                    height="100px"
                                    alt={item.title}
                                    onError={(e) => { e.target.onerror = null; e.target.src = foodImg }}
                                />
                                <div className='card-body'>
                                    <div className='title'>{item.title}</div>
                                    <div className='category-badge'>{item.category}</div>
                                    <div className='rating'>
                                        {item.avgRating ? `⭐ ${item.avgRating} / 5` : "No ratings yet"}
                                    </div>
                                    <div className='icons'>
                                        <div className='timer'><BsStopwatchFill />{item.time}</div>
                                        {(!path) ? <FaHeart onClick={() => favRecipe(item)}
                                            style={{ color: (favItems.some(res => res._id === item._id)) ? "red" : "" }} /> :
                                            <div className='action'>
                                                <Link to={`/editRecipe/${item._id}`} className="editIcon"><FaEdit /></Link>
                                                <MdDelete onClick={() => onDelete(item._id)} className='deleteIcon' />
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </>
    )
}
