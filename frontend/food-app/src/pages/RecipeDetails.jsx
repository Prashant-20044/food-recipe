import React from 'react'
import profileImg from '../assets/profile.png'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { api, getProfileImageUrl, getImageUrl } from '../api'
import ConfirmDialog from '../components/ConfirmDialog'

export default function RecipeDetails() {
    const recipe = useLoaderData()
    const navigate = useNavigate()
    const currentUser = JSON.parse(localStorage.getItem("user") || "null")
    const token = localStorage.getItem("token")
    const isOwnRecipe = currentUser?._id && recipe?.createdBy === currentUser._id
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const ingredients = Array.isArray(recipe?.ingredients)
        ? recipe.ingredients.flatMap((item) => String(item).split(","))
        : String(recipe?.ingredients || "").split(",")
    const ingredientItems = ingredients
        .map((item) => item.trim())
        .filter(Boolean)

    const onDelete = async () => {
        if (!token) {
            navigate("/login")
            return
        }

        await api.delete(`/recipe/${recipe._id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        navigate("/")
    }

    if (!recipe) {
        return (
            <div className='outer-container'>
                <Link to="/" className='back-link'>Back to Recipes</Link>
                <div className='empty-state'>Recipe not found.</div>
            </div>
        )
    }

    return (
        <div className='outer-container'>
            <Link to="/" className='back-link'>← Back to Recipes</Link>

            <div
                className='profile recipe-author-link'
                onClick={() => recipe.creatorId && navigate(`/profile/${recipe.creatorId}`)}
            >
                <img
                    src={recipe.creatorId ? getProfileImageUrl({
                        profilePic: recipe.creatorProfilePic,
                        username: recipe.creatorUsername,
                        email: recipe.email
                    }) : profileImg}
                    alt="Author avatar"
                />
                <h5>{recipe.creatorUsername || recipe.email}</h5>
            </div>

            <h3 className='title'>{recipe.title}</h3>

            {isOwnRecipe && (
                <div className='detail-actions'>
                    <Link to={`/editRecipe/${recipe._id}`} className='btn-secondary detail-action-btn'>Edit</Link>
                    <button type='button' className='btn-primary detail-action-btn danger' onClick={() => setShowDeleteDialog(true)}>
                        Delete
                    </button>
                </div>
            )}

            <img
                src={getImageUrl(recipe.coverImage)}
                alt={recipe.title}
                className='detail-image'
            />

            <div className='recipe-details'>
                <div className='ingredients'>
                    <h4>Ingredients</h4>
                    <ul>
                        {ingredientItems.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className='instructions'>
                    <h4>Instructions</h4>
                    <p>{recipe.instructions}</p>
                </div>
            </div>
            {showDeleteDialog && (
                <ConfirmDialog
                    title="Delete Post"
                    message="Are you sure you want to delete this post?"
                    confirmText="Yes"
                    cancelText="No"
                    onConfirm={onDelete}
                    onCancel={() => setShowDeleteDialog(false)}
                />
            )}
        </div>
    )
}
