const mongoose = require("mongoose")
const Recipes = require("../models/recipe")
const multer  = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images')
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname) || ''
      const filename = `${Date.now()}-${file.fieldname}${ext}`
      cb(null, filename)
    }
  })
  
  const upload = multer({ storage: storage })

const getRecipes = async (req, res) => {
    try {
        const recipes = await Recipes.find()
        return res.json(recipes)
    } catch (err) {
        return res.status(500).json({ message: err.message || "Unable to fetch recipes" })
    }
}

const getRecipe = async (req, res) => {
    if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid recipe id" })
    }

    const recipe = await Recipes.findById(req.params.id)
    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" })
    }

    res.json(recipe)
}

const addRecipe = async (req, res) => {
    try {
        const { title, ingredients, instructions, time, category } = req.body

        if (!title || !ingredients || !instructions || !category) {
            return res.status(400).json({ message: "Required fields can't be empty" })
        }

        const newRecipe = await Recipes.create({
            title,
            ingredients,
            instructions,
            time,
            category,
            coverImage: req.file?.filename,
            createdBy: req.user.id
        })
        return res.json(newRecipe)
    } catch (err) {
        return res.status(500).json({ message: err.message || "Unable to create recipe" })
    }
}

const editRecipe = async (req, res) => {
    const { title, ingredients, instructions, time, category } = req.body

    if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid recipe id" })
    }

    try {
        const recipe = await Recipes.findById(req.params.id)
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" })
        }

        if (recipe.createdBy?.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only edit your own recipe" })
        }

        const coverImage = req.file?.filename || recipe.coverImage
        recipe.title = title ?? recipe.title
        recipe.ingredients = ingredients ?? recipe.ingredients
        recipe.instructions = instructions ?? recipe.instructions
        recipe.time = time ?? recipe.time
        recipe.category = category ?? recipe.category
        recipe.coverImage = coverImage

        await recipe.save()
        res.json(recipe)
    } catch (err) {
        return res.status(400).json({ message: err.message || "Unable to update recipe" })
    }
}
const deleteRecipe = async (req, res) => {
    if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid recipe id" })
    }

    try {
        const recipe = await Recipes.findById(req.params.id)
        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" })
        }

        if (recipe.createdBy?.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own recipe" })
        }

        await recipe.deleteOne()
        res.json({ status: "ok" })
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Unable to delete recipe" })
    }
}

const addComment = async (req, res) => {
    const { text } = req.body
    if (!text) {
        return res.status(400).json({ message: "Comment text is required" })
    }

    if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid recipe id" })
    }

    const recipe = await Recipes.findById(req.params.id)
    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" })
    }

    recipe.comments = recipe.comments ?? []
    recipe.comments.push({
        user: req.user.id,
        email: req.user.email,
        username: req.user.username,
        profilePic: req.user.profilePic,
        text
    })

    await recipe.save()
    res.json(recipe)
}

const deleteComment = async (req, res) => {
    const { id, commentId } = req.params

    if (!id || !mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid recipe id" })
    }

    if (!commentId || !mongoose.isValidObjectId(commentId)) {
        return res.status(400).json({ message: "Invalid comment id" })
    }

    const recipe = await Recipes.findById(id)
    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" })
    }

    const comment = recipe.comments?.id(commentId)
    if (!comment) {
        return res.status(404).json({ message: "Comment not found" })
    }

    if (comment.user?.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own comments" })
    }

    comment.deleteOne()
    await recipe.save()

    res.json(recipe)
}

const addRating = async (req, res) => {
    const { value } = req.body
    const rating = Number(value)

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be a number between 1 and 5" })
    }

    if (!req.params.id || !mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid recipe id" })
    }

    const recipe = await Recipes.findById(req.params.id)
    if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" })
    }

    recipe.ratings = recipe.ratings ?? []
    const existing = recipe.ratings.find(r => r.user?.toString() === req.user.id)
    if (existing) {
        existing.value = rating
    } else {
        recipe.ratings.push({
            user: req.user.id,
            value: rating
        })
    }

    await recipe.save()
    res.json(recipe)
}

const getRecipesByUser = async (req, res) => {
    const userId = req.params.id

    if (!userId || !mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user id" })
    }

    const recipes = await Recipes.find({ createdBy: userId })
    res.json(recipes)
}

module.exports = { getRecipes, getRecipe, addRecipe, editRecipe, deleteRecipe, addComment, addRating, deleteComment, getRecipesByUser, upload }
