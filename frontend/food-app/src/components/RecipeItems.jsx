import React, { useEffect, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { BsStopwatchFill } from "react-icons/bs";
import { FaHeart } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { api, getImageUrl } from '../api'

export default function RecipeItems() {
    const recipes = useLoaderData();
    // always work with an array to avoid map errors
    const [allRecipes, setAllRecipes] = useState([]);
    let path = window.location.pathname === "/myRecipe" ? true : false;
    let favItems = JSON.parse(localStorage.getItem("fav")) ?? [];
    if (!Array.isArray(favItems)) favItems = [];
    const [isFavRecipe, setIsFavRecipe] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // if recipes is not an array, coerce to empty array
        setAllRecipes(Array.isArray(recipes) ? recipes : []);
    }, [recipes]);

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

    if (allRecipes.length === 0) {
        return (
            <div className='empty-state'>
                <div className='empty-state-icon'>🍽️</div>
                <h3>No recipes yet</h3>
                <p>Be the first to share a delicious recipe!</p>
            </div>
        )
    }

    return (
        <div className='card-container'>
            {
                allRecipes.map((item, index) => (
                    <div
                        key={index}
                        className='card'
                        onDoubleClick={() => navigate(`/recipe/${item._id}`)}
                        style={{ animationDelay: `${index * 0.08}s` }}
                    >
                        <div className='card-img-wrapper'>
                            <img
                                src={getImageUrl(item.coverImage)}
                                alt={item.title}
                            />
                            <div className='card-img-overlay'></div>
                        </div>
                        <div className='card-body'>
                            <div className='title'>{item.title}</div>
                            <div className='icons'>
                                <div className='timer'>
                                    <BsStopwatchFill />{item.time}
                                </div>
                                {(!path) ?
                                    <button
                                        className={`fav-btn ${favItems.some(res => res._id === item._id) ? 'active' : ''}`}
                                        onClick={() => favRecipe(item)}
                                    >
                                        <FaHeart
                                            style={{ color: (favItems.some(res => res._id === item._id)) ? "" : "" }}
                                        />
                                    </button>
                                    :
                                    <div className='action'>
                                        <Link to={`/editRecipe/${item._id}`} className="editIcon"><FaEdit /></Link>
                                        <MdDelete onClick={() => onDelete(item._id)} className='deleteIcon' />
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}
