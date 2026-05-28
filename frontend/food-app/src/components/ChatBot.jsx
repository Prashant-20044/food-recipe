import React, { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, getImageUrl } from '../api'
import '../styles/ChatBot.css'
import ReactMarkdown from 'react-markdown'

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your cooking assistant. Ask me how to cook any dish, and I'll explain the process with relevant recipe posts from the app.",
      sender: 'bot'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestedRecipes, setSuggestedRecipes] = useState([])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const question = inputValue.trim()
    if (!question) return

    const userMessage = {
      id: crypto.randomUUID(),
      text: question,
      sender: 'user'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const response = await api.post('/chatbot/ask', { question })

      const botMessage = {
        id: crypto.randomUUID(),
        text: response.data.answer || response.data.message || 'I could not generate an answer this time.',
        sender: 'bot'
      }

      setMessages(prev => [...prev, botMessage])
      setSuggestedRecipes(response.data.suggestedRecipes || [])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: crypto.randomUUID(),
        text: error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        sender: 'bot'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chatbot-button"
        title="Chat with cooking assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>Cooking Assistant</h3>
            <button onClick={() => setIsOpen(false)} title="Close cooking assistant">
              <X size={20} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
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

          {suggestedRecipes.length > 0 && (
            <div className="suggested-recipes">
              <h4>Relevant posts</h4>
              <div className="recipe-list">
                {suggestedRecipes.map((recipe) => (
                  <Link
                    key={recipe._id}
                    to={`/recipe/${recipe._id}`}
                    className="recipe-item"
                    onClick={() => setIsOpen(false)}
                  >
                    <img
                      src={getImageUrl(recipe.coverImage)}
                      alt={recipe.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80'
                      }}
                    />
                    <span>{recipe.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="chatbot-input">
            <input
              type="text"
              placeholder="Ask me how to cook..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading} title="Send message">
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
