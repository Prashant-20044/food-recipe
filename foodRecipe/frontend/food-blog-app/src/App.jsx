import React from 'react'
import './App.css'
import {createBrowserRouter,RouterProvider} from "react-router-dom"
import Home from './pages/Home'
import MainNavigation from './components/MainNavigation'
import { api } from './api'
import  AddFoodRecipe  from './pages/AddFoodRecipe'
import EditRecipe from './pages/EditRecipe'
import RecipeDetails from './pages/RecipeDetails'
import Profile, { loader as profileLoader } from './pages/Profile'
import Chat from './pages/Chat'
import Chats from './pages/Chats'

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
  return JSON.parse(localStorage.getItem("fav"))
}

const getRecipe=async({params})=>{
  let recipe;
  await api.get(`/recipe/${params.id}`)
  .then(res=>recipe=res.data)

  if (recipe?.createdBy) {
    await api.get(`/user/${recipe.createdBy}`)
      .then(res=>{
        recipe = {
          ...recipe,
          creatorId: recipe.createdBy,
          creatorUsername: res.data.username,
          creatorEmail: res.data.email,
          creatorProfilePic: res.data.profilePic
        }
      })
      .catch(()=>{
        // If user not found / invalid id, just continue without creator info
        recipe = {
          ...recipe,
          creatorId: recipe.createdBy,
          creatorUsername:'',
          creatorEmail:'',
          creatorProfilePic:''
        }
      })
  } else {
    recipe = {...recipe, creatorId: null, creatorUsername:'', creatorEmail:'', creatorProfilePic:''}
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
    {path:"/profile/:identifier",element:<Profile/>,loader:profileLoader},
    {path:"/chat/:id",element:<Chat/>},
    {path:"/chats",element:<Chats/>}
  ]}
 
])

export default function App() {
  return (
   <>
   <RouterProvider router={router}></RouterProvider>
   </>
  )
}
