import React from 'react'
import './App.css'
import {createBrowserRouter,RouterProvider} from "react-router-dom"
import Home from './pages/Home'
import MainNavigation from './components/MainNavigation'
import axios from 'axios'
import  AddFoodRecipe  from './pages/AddFoodRecipe'
import EditRecipe from './pages/EditRecipe'
import RecipeDetails from './pages/RecipeDetails'
import Login from './pages/Login'


const getAllRecipes=async()=>{
  return []
}

const getMyRecipes=async()=>{
  let user=JSON.parse(localStorage.getItem("user"))
  let allRecipes=await getAllRecipes()
  return allRecipes.filter(item=>item.createdBy===user._id)
}

const getFavRecipes=()=>{
  // localStorage might be empty or contain a non-array; ensure we always return an array
  const fav = JSON.parse(localStorage.getItem("fav"));
  return Array.isArray(fav) ? fav : [];
}

const getRecipe=async({params})=>{
  let recipe;
  try {
    const res = await axios.get(`http://localhost:5000/recipe/${params.id}`)
    recipe = res.data

    const userRes = await axios.get(`http://localhost:5000/user/${recipe.createdBy}`)
    recipe = {...recipe, email: userRes.data.email}
  } catch (error) {
    console.error('Failed to fetch recipe:', error)
    recipe = null
  }

  return recipe
}

const router=createBrowserRouter([
  {path:"/",element:<MainNavigation/>,children:[
    {path:"/",element:<Home/>,loader:getAllRecipes},
    {path:"/myRecipe",element:<Home/>,loader:getMyRecipes},
    {path:"/favRecipe",element:<Home/>,loader:getFavRecipes},
    {path:"/addRecipe",element:<AddFoodRecipe/>},
    {path:"/editRecipe/:id",element:<EditRecipe/>},
    {path:"/recipe/:id",element:<RecipeDetails/>,loader:getRecipe},
    {path:"/login",element:<Login/>}
  ]}
 
])

export default function App() {
  return (
   <>
   <RouterProvider router={router}></RouterProvider>
   </>
  )
}
