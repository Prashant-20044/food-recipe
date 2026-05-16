import React from 'react'
import profileImg from '../assets/profile.png'
import { Link, useLoaderData } from 'react-router-dom'

export default function RecipeDetails() {
    const recipe = useLoaderData()

    return (
        <div className='outer-container'>
            <Link to="/" className='back-link'>← Back to Recipes</Link>

            <div className='profile'>
                <img src={profileImg} alt="Author avatar" />
                <h5>{recipe.email}</h5>
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
                    <span>{recipe.instructions}</span>
                </div>
            </div>
        </div>
    )
}
