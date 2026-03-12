const express = require("express")
const { getRecipes, getRecipesByUser, getRecipe, addRecipe, editRecipe, deleteRecipe, addComment, addRating, deleteComment, upload } = require("../controller/recipe")
const verifyToken = require("../middleware/auth")
const router = express.Router()

router.get("/", getRecipes) //Get all recipes
router.get("/user/:id", getRecipesByUser) //Get recipes by user id
router.get("/:id", getRecipe) //Get recipe by id
router.post("/", upload.single('file'), verifyToken, addRecipe) //add recipe
router.put("/:id", upload.single('file'), editRecipe) //Edit recipe
router.delete("/:id", deleteRecipe) //Delete recipe

router.post("/:id/comment", verifyToken, addComment) // Add a comment to a recipe
router.delete("/:id/comment/:commentId", verifyToken, deleteComment) // Delete a comment from a recipe
router.post("/:id/rate", verifyToken, addRating) // Add or update a rating for a recipe

module.exports = router