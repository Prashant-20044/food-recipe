import React, { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { api } from '../api'
import '../styles/ChatBot.css'

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your cooking assistant. Ask me how to cook any dish, and I'll explain the process and suggest similar recipes from our database!",
      sender: 'bot'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestedRecipes, setSuggestedRecipes] = useState([])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user'
    }
    setMessages([...messages, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const response = await api.post('/chatbot/ask', {
        question: inputValue
      })

      const botMessage = {
        id: messages.length + 2,
        text: response.data.answer,
        sender: 'bot'
      }
      setMessages(prev => [...prev, botMessage])
      setSuggestedRecipes(response.data.suggestedRecipes || [])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: messages.length + 2,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-button"
        title="Chat with cooking assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>Cooking Assistant 👨‍🍳</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {loading && (
              <div className="message bot">
                <p className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </p>
              </div>
            )}
          </div>

          {/* Suggested Recipes */}
          {suggestedRecipes.length > 0 && (
            <div className="suggested-recipes">
              <h4>📚 Similar Recipes:</h4>
              <div className="recipe-list">
                {suggestedRecipes.map((recipe) => (
                  <a
                    key={recipe._id}
                    href={`/recipe/${recipe._id}`}
                    className="recipe-item"
                  >
                    <img
                      src={recipe.coverImage}
                      alt={recipe.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80'
                      }}
                    />
                    <span>{recipe.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="chatbot-input">
            <input
              type="text"
              placeholder="Ask me how to cook..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
