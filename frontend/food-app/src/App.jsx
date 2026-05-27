import React from 'react'
import './App.css'
import {createBrowserRouter, RouterProvider, Navigate, useLocation} from "react-router-dom"
import Home from './pages/Home'
import MainNavigation from './components/MainNavigation'
import { CallProvider } from './context/CallContext'
import { api } from './api'
import  AddFoodRecipe  from './pages/AddFoodRecipe'
import EditRecipe from './pages/EditRecipe'
import RecipeDetails from './pages/RecipeDetails'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Chats from './pages/Chats'
import Chat from './pages/Chat'


function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")
  const user = localStorage.getItem("user")
  const location = useLocation()
  
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

const getAllRecipes=async()=>{
  const res = await api.get('/recipe')
  return res.data
}

const getMyRecipes=async()=>{
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"))
  } catch {
    user = null
  }
  if (!user) return [];
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
    {path:"/myRecipe",element:<ProtectedRoute><Home/></ProtectedRoute>,loader:getMyRecipes},
    {path:"/favRecipe",element:<ProtectedRoute><Home/></ProtectedRoute>,loader:getFavRecipes},
    {path:"/addRecipe",element:<ProtectedRoute><AddFoodRecipe/></ProtectedRoute>},
    {path:"/editRecipe/:id",element:<ProtectedRoute><EditRecipe/></ProtectedRoute>},
    {path:"/recipe/:id",element:<ProtectedRoute><RecipeDetails/></ProtectedRoute>,loader:getRecipe},
    {path:"/login",element:<Login/>,loader:getAllRecipes},
    {path:"/profile/:identifier",element:<ProtectedRoute><Profile/></ProtectedRoute>},
    {path:"/messages",element:<ProtectedRoute><Chats/></ProtectedRoute>},
    {path:"/messages/:id",element:<ProtectedRoute><Chat/></ProtectedRoute>}
  ]}
 
])

export default function App() {
  return (
   <CallProvider>
     <RouterProvider router={router}></RouterProvider>
   </CallProvider>
  )
}
