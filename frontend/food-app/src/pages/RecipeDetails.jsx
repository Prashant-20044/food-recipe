import React from 'react'
import profileImg from '../assets/profile.png'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { getProfileImageUrl } from '../api'

export default function RecipeDetails() {
    const recipe = useLoaderData()
    const navigate = useNavigate()

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

            <img
                src={`http://localhost:5000/images/${recipe.coverImage}`}
                alt={recipe.title}
                className='detail-image'
            />

            <div className='recipe-details'>
                <div className='ingredients'>
                    <h4>Ingredients</h4>
                    <ul>
                        {recipe.ingredients.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                </div>
                <div className='instructions'>
                    <h4>Instructions</h4>
                    <p>{recipe.instructions}</p>
                </div>
            </div>
        </div>
    )
}
