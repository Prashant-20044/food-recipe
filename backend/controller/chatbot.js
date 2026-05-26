const Recipe = require("../models/recipe")

const DEFAULT_MODEL = "openai/gpt-4o-mini"
const STOP_WORDS = new Set([
  "how", "do", "i", "you", "to", "cook", "make", "prepare", "recipe", "for",
  "steps", "step", "tell", "me", "any", "a", "an", "the", "please", "with",
  "of", "in", "about", "dish", "food"
])

exports.askQuestion = async (req, res) => {
  try {
    const question = String(req.body.question || "").trim()

    if (!question) {
      return res.status(400).json({ message: "Question cannot be empty" })
    }

    const searchTerms = getSearchTerms(question)
    const suggestedRecipes = await findSuggestedRecipes(searchTerms)
    const answer = await getCookingAnswer(question, suggestedRecipes)

    return res.status(200).json({
      answer,
      suggestedRecipes
    })
  } catch (error) {
    console.error("Chatbot error:", error)
    return res.status(500).json({
      message: "Error processing your question",
      error: error.message
    })
  }
}

async function getCookingAnswer(question, suggestedRecipes) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is missing in .env")
  }

  const recipeContext = suggestedRecipes.length
    ? suggestedRecipes
      .map((recipe, index) => {
        const ingredients = Array.isArray(recipe.ingredients)
          ? recipe.ingredients.join(", ")
          : recipe.ingredients || "Not listed"

        return `${index + 1}. ${recipe.title} | Category: ${recipe.category || "Not listed"} | Time: ${recipe.time || "Not listed"} | Ingredients: ${ingredients}`
      })
      .join("\n")
    : "No matching app recipes were found."

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
      "X-Title": "TasteNest Cooking Assistant"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "You are a practical cooking assistant inside a recipe sharing app.",
            "Answer cooking questions with clear, numbered steps.",
            "Include ingredients, prep notes, cooking time, and serving tips when useful.",
            "If app recipes are provided, briefly mention that related posts are shown below the chat.",
            "Do not invent app post titles that are not in the provided context."
          ].join(" ")
        },
        {
          role: "user",
          content: `Question: ${question}\n\nRelevant app recipes:\n${recipeContext}`
        }
      ],
      temperature: 0.7,
      max_tokens: 700
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const answer = data.choices?.[0]?.message?.content?.trim()

  if (!answer) {
    throw new Error("OpenRouter returned an empty response")
  }

  return answer
}

async function findSuggestedRecipes(searchTerms) {
  if (searchTerms.length === 0) {
    return Recipe.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title coverImage category ingredients time _id")
      .lean()
  }

  const regexes = searchTerms.map((term) => new RegExp(escapeRegex(term), "i"))
  const exactPhrase = searchTerms.join(" ")
  const queryParts = [
    { title: { $regex: exactPhrase, $options: "i" } },
    { category: { $regex: exactPhrase, $options: "i" } },
    ...regexes.flatMap((regex) => ([
      { title: regex },
      { category: regex },
      { ingredients: regex }
    ]))
  ]

  const recipes = await Recipe.find({ $or: queryParts })
    .limit(12)
    .select("title coverImage category ingredients time _id")
    .lean()

  return recipes
    .map((recipe) => ({
      recipe,
      score: scoreRecipe(recipe, searchTerms)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ recipe }) => recipe)
}

function getSearchTerms(question) {
  const cleaned = question
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))

  return [...new Set(cleaned)].slice(0, 8)
}

function scoreRecipe(recipe, searchTerms) {
  const title = String(recipe.title || "").toLowerCase()
  const category = String(recipe.category || "").toLowerCase()
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.join(" ").toLowerCase()
    : String(recipe.ingredients || "").toLowerCase()

  return searchTerms.reduce((score, term) => {
    if (title.includes(term)) score += 4
    if (category.includes(term)) score += 2
    if (ingredients.includes(term)) score += 1
    return score
  }, 0)
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
