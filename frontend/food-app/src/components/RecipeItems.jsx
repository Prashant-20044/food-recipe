import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { BsStopwatchFill } from "react-icons/bs";
import { FaHeart } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { api, getImageUrl } from '../api'
import ConfirmDialog from './ConfirmDialog';
import { BloomFilter, tokenizeForSearch } from '../utils/bloomFilter';

export default function RecipeItems() {
    const recipes = useLoaderData();
    // always work with an array to avoid map errors
    const [allRecipes, setAllRecipes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    let favItems = JSON.parse(localStorage.getItem("fav")) ?? [];
    if (!Array.isArray(favItems)) favItems = [];
    const [isFavRecipe, setIsFavRecipe] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState(null);
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    const stopWords = useMemo(() => new Set(["a", "an", "and", "for", "of", "recipe", "the", "to", "with"]), [])

    useEffect(() => {
        // if recipes is not an array, coerce to empty array
        setAllRecipes(Array.isArray(recipes) ? recipes : []);
    }, [recipes]);

    const onDelete = async () => {
        if (!token) {
            navigate("/login")
            return
        }

        await api.delete(`/recipe/${recipeToDelete._id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => console.log(res))
        setAllRecipes(recipes => recipes.filter(recipe => recipe._id !== recipeToDelete._id))
        let filterItem = favItems.filter(recipe => recipe._id !== recipeToDelete._id)
        localStorage.setItem("fav", JSON.stringify(filterItem))
        setRecipeToDelete(null)
    }

    const favRecipe = (item) => {
        let filterItem = favItems.filter(recipe => recipe._id !== item._id)
        favItems = favItems.filter(recipe => recipe._id === item._id).length === 0 ? [...favItems, item] : filterItem
        localStorage.setItem("fav", JSON.stringify(favItems))
        setIsFavRecipe(pre => !pre)
    }

    const normalize = (value) => String(value || "").toLowerCase().trim()
    const searchableText = (recipe) => normalize([
        recipe.title,
        recipe.category,
        Array.isArray(recipe.ingredients) ? recipe.ingredients.join(" ") : recipe.ingredients
    ].filter(Boolean).join(" "))
    const recipeSearchIndex = useMemo(() => allRecipes.map((recipe) => {
        const text = searchableText(recipe)
        const filter = new BloomFilter()

        tokenizeForSearch(text)
            .filter((word) => word.length > 1 && !stopWords.has(word))
            .forEach((word) => filter.add(word))

        return { recipe, text, filter }
    }), [allRecipes, stopWords])
    const searchWords = normalize(searchTerm)
        .split(/\s+/)
        .filter((word) => word.length > 1 && !stopWords.has(word))
    const normalizedSearch = normalize(searchTerm)
    const isSearching = normalizedSearch.length > 0
    const exactMatches = isSearching
        ? allRecipes.filter((recipe) => normalize(recipe.title).includes(normalizedSearch))
        : []
    const exactMatchIds = new Set(exactMatches.map((recipe) => recipe._id))
    const suggestedRecipes = isSearching
        ? recipeSearchIndex
            .filter(({ recipe, filter }) => (
                !exactMatchIds.has(recipe._id)
                && searchWords.some((word) => filter.mightContain(word))
            ))
            .map(({ recipe, text }) => {
                const title = normalize(recipe.title)
                const score = searchWords.reduce((total, word) => {
                    if (title.includes(word)) return total + 3
                    if (text.includes(word)) return total + 1
                    return total
                }, 0)

                return { recipe, score }
            })
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map((item) => item.recipe)
        : allRecipes
    const recipesToShow = isSearching ? suggestedRecipes : allRecipes

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
        <>
            <div className='recipe-search'>
                <input
                    type='search'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder='Search recipes, ingredients, or categories...'
                    aria-label='Search recipes'
                />
                {searchTerm && (
                    <button type='button' onClick={() => setSearchTerm("")}>
                        Clear
                    </button>
                )}
            </div>

            {isSearching && (
                <div className='search-results-summary'>
                    <h3>Search results for "{searchTerm}"</h3>
                    {exactMatches.length > 0 ? (
                        <div className='exact-match-list'>
                            <p>Exact recipes</p>
                            {exactMatches.map((recipe) => (
                                <button key={recipe._id} type='button' onClick={() => navigate(`/recipe/${recipe._id}`)}>
                                    {recipe.title}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p>No exact recipe found. Showing related suggestions.</p>
                    )}
                </div>
            )}

            {isSearching && recipesToShow.length > 0 && (
                <h3 className='suggestion-heading'>Suggestions</h3>
            )}

            {isSearching && exactMatches.length === 0 && recipesToShow.length === 0 ? (
                <div className='empty-state'>
                    <h3>No matching recipes</h3>
                    <p>Try searching by a main ingredient, dish name, or category.</p>
                </div>
            ) : (
                <div className='card-container'>
                    {
                        recipesToShow.map((item, index) => {
                    const isOwnRecipe = currentUser?._id && item.createdBy === currentUser._id

                    return (
                        <div
                            key={item._id || index}
                            className='card'
                            onClick={() => navigate(`/recipe/${item._id}`)}
                            role='button'
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    navigate(`/recipe/${item._id}`)
                                }
                            }}
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
                                    {isOwnRecipe ?
                                        <div className='action'>
                                            <Link
                                                to={`/editRecipe/${item._id}`}
                                                className="editIcon"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <FaEdit />
                                            </Link>
                                            <button
                                                type="button"
                                                className='icon-btn deleteIcon'
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setRecipeToDelete(item)
                                                }}
                                                aria-label={`Delete ${item.title}`}
                                            >
                                                <MdDelete />
                                            </button>
                                        </div>
                                        :
                                        <button
                                            className={`fav-btn ${favItems.some(res => res._id === item._id) ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                favRecipe(item)
                                            }}
                                        >
                                            <FaHeart
                                                style={{ color: (favItems.some(res => res._id === item._id)) ? "" : "" }}
                                            />
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>
                    )
                        })
                    }
                </div>
            )}
            {recipeToDelete && (
                    <ConfirmDialog
                        title="Delete Post"
                        message="Are you sure you want to delete this post?"
                        confirmText="Yes"
                        cancelText="No"
                        onConfirm={onDelete}
                        onCancel={() => setRecipeToDelete(null)}
                    />
                )}
        </>
    )
}
