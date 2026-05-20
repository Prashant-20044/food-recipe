import React from 'react'
import './App.css'
import {createBrowserRouter,RouterProvider} from "react-router-dom"
import Home from './pages/Home'
import MainNavigation from './components/MainNavigation'
import ChatBot from './components/ChatBot'
import { api } from './api'
import  AddFoodRecipe  from './pages/AddFoodRecipe'
import EditRecipe from './pages/EditRecipe'
import RecipeDetails from './pages/RecipeDetails'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Chats from './pages/Chats'
import Chat from './pages/Chat'


const getAllRecipes=async()=>{
  const res = await api.get('/recipe')
  return res.data
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
    const res = await api.get(`/recipe/${params.id}`)
    recipe = res.data

    const userRes = await api.get(`/user/${recipe.createdBy}`)
    recipe = {
      ...recipe,
      email: userRes.data.email,
      creatorId: userRes.data._id,
      creatorUsername: userRes.data.username,
      creatorProfilePic: userRes.data.profilePic
    }
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
    {path:"/login",element:<Login/>,loader:getAllRecipes},
    {path:"/profile/:identifier",element:<Profile/>},
    {path:"/messages",element:<Chats/>},
    {path:"/messages/:id",element:<Chat/>}
  ]}
 
])

export default function App() {
  return (
   <>
   <RouterProvider router={router}></RouterProvider>
   <ChatBot />
   </>
  )
}
