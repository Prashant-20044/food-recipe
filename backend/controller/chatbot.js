const Recipe = require("../models/recipe");

// This will be called when the user asks a question to the chatbot
exports.askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question cannot be empty" });
    }

    // Call Ollama API
    const ollamaResponse = await callOllama(question);

    // Extract dish name from the question to search for similar recipes
    const dishName = extractDishName(question);

    // Search for similar recipes in the database
    const suggestedRecipes = await Recipe.find({
      $or: [
        { title: { $regex: dishName, $options: "i" } },
        { category: { $regex: dishName, $options: "i" } },
        { ingredients: { $regex: dishName, $options: "i" } }
      ]
    })
      .limit(5)
      .select("title coverImage _id");

    return res.status(200).json({
      answer: ollamaResponse,
      suggestedRecipes: suggestedRecipes
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return res.status(500).json({
      message: "Error processing your question",
      error: error.message
    });
  }
};

// Call Ollama API (local LLM)
async function callOllama(question) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "mistral";

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful cooking assistant. When asked how to cook a dish, provide clear, step-by-step instructions. Keep your response concise but informative. Include estimated cooking time if possible."
          },
          {
            role: "user",
            content: question
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} - Make sure Ollama is running on ${ollamaUrl}`
      );
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    throw new Error(
      `Failed to connect to Ollama: ${error.message}. Make sure Ollama is running locally.`
    );
  }
}

// Extract dish name from the question
function extractDishName(question) {
  // Simple extraction - looks for common cooking phrases
  const lowerQuestion = question.toLowerCase();

  const phrases = [
    "how to cook",
    "how do i cook",
    "how do you cook",
    "recipe for",
    "make",
    "prepare"
  ];

  for (const phrase of phrases) {
    const index = lowerQuestion.indexOf(phrase);
    if (index !== -1) {
      // Extract text after the phrase
      const dishName = question
        .substring(index + phrase.length)
        .trim()
        .replace(/\?$/, "")
        .split(/[,.]/)
        [0]
        .trim();

      return dishName || question;
    }
  }

  return question;
}

