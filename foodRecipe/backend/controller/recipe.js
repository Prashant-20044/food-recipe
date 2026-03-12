const Recipes=require("../models/recipe")
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

const getRecipes=async(req,res)=>{
    const recipes=await Recipes.find()
    return res.json(recipes)
}

const getRecipe=async(req,res)=>{
    const recipe=await Recipes.findById(req.params.id)
    res.json(recipe)
}

const addRecipe = async (req, res) => {
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
}

const editRecipe = async (req, res) => {
    const { title, ingredients, instructions, time, category } = req.body
    let recipe = await Recipes.findById(req.params.id)

    try {
        if (recipe) {
            let coverImage = req.file?.filename ? req.file?.filename : recipe.coverImage
            await Recipes.findByIdAndUpdate(req.params.id, { ...req.body, coverImage }, { new: true })
            res.json({ title, ingredients, instructions, time, category })
        }
    }
    catch (err) {
        return res.status(404).json({ message: err })
    }

}
const deleteRecipe = async (req, res) => {
    try {
        await Recipes.deleteOne({ _id: req.params.id })
        res.json({ status: "ok" })
    }
    catch (err) {
        return res.status(400).json({ message: "error" })
    }
}

const addComment = async (req, res) => {
    const { text } = req.body
    if (!text) {
        return res.status(400).json({ message: "Comment text is required" })
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

    comment.remove()
    await recipe.save()

    res.json(recipe)
}

const addRating = async (req, res) => {
    const { value } = req.body
    const rating = Number(value)

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be a number between 1 and 5" })
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

    if (!userId) {
        return res.status(400).json({ message: "Invalid user id" })
    }

    const recipes = await Recipes.find({ createdBy: userId })
    res.json(recipes)
}

module.exports = { getRecipes, getRecipe, addRecipe, editRecipe, deleteRecipe, addComment, addRating, deleteComment, getRecipesByUser, upload }