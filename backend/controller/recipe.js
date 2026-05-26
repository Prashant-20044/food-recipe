const mongoose = require("mongoose")
const Recipes = require("../models/recipe")
const multer  = require('multer')
const cloudinary = require('../cloudinary')
const streamifier = require('streamifier')
const fs = require('fs')
const path = require('path')

const storage = multer.memoryStorage()
const upload = multer({ storage })

const normalizeIngredients = (ingredients) => {
    if (Array.isArray(ingredients)) {
        return ingredients
            .flatMap((item) => String(item).split(","))
            .map((item) => item.trim())
            .filter(Boolean)
    }

    return String(ingredients || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
}

const uploadToCloudinary = (buffer, folder) => new Promise((resolve, reject) => {
    if (!buffer) return reject(new Error('No buffer provided for upload'))

    // If Cloudinary is not configured, save locally to public/images and return local path
    const cloudConf = cloudinary.config()
    if (!cloudConf.cloud_name || !cloudConf.api_key || !cloudConf.api_secret) {
        try {
            const imagesDir = path.join(__dirname, '..', 'public', 'images')
            if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true })
            const filename = `${Date.now()}-upload.jpg`
            const filePath = path.join(imagesDir, filename)
            fs.writeFileSync(filePath, buffer)
            return resolve({ localPath: filename })
        } catch (err) {
            console.error('Failed to save image locally:', err)
            return reject(new Error('Failed to save image locally: ' + err.message))
        }
    }

    const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
            if (error) {
                console.error('Cloudinary upload error:', error)
                return reject(new Error('Cloudinary upload failed: ' + (error.message || error)))
            }
            resolve(result)
        }
    )

    try {
        streamifier.createReadStream(buffer).pipe(stream)
    } catch (err) {
        console.error('Error streaming buffer to Cloudinary:', err)
        return reject(new Error('Error streaming buffer to Cloudinary: ' + err.message))
    }
})

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
        const ingredientList = normalizeIngredients(ingredients)

        if (!title || ingredientList.length === 0 || !instructions || !category) {
            return res.status(400).json({ message: "Required fields can't be empty" })
        }

                let coverImageUrl = ""
                if (req.file?.buffer) {
                    try {
                        const uploadResult = await uploadToCloudinary(req.file.buffer, "foodRecipeApp/recipes")
                        coverImageUrl = uploadResult?.secure_url || uploadResult?.localPath || ""
                    } catch (err) {
                        console.error('Recipe image upload failed:', err.message || err)
                        return res.status(500).json({ message: 'Recipe image upload failed', error: err.message || err })
                    }
                }

        const newRecipe = await Recipes.create({
            title,
            ingredients: ingredientList,
            instructions,
            time,
            category,
            coverImage: coverImageUrl,
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

                let coverImage = recipe.coverImage
                if (req.file?.buffer) {
                    try {
                        const uploadResult = await uploadToCloudinary(req.file.buffer, "foodRecipeApp/recipes")
                        coverImage = uploadResult?.secure_url || uploadResult?.localPath || coverImage
                    } catch (err) {
                        console.error('Recipe image upload failed:', err.message || err)
                        return res.status(500).json({ message: 'Recipe image upload failed', error: err.message || err })
                    }
                }
        recipe.title = title ?? recipe.title
        recipe.ingredients = ingredients !== undefined ? normalizeIngredients(ingredients) : recipe.ingredients
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
