const mongoose = require('mongoose')

const connectDb = async () => {
  const defaultUri = 'mongodb://127.0.0.1:27017/foodRecipeDB'
  const uri = process.env.CONNECTION_STRING || defaultUri

  const options = {
    serverSelectionTimeoutMS: 5000
  }

  const maxAttempts = 5
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(uri, options)
      console.log('MongoDB connected')
      return
    } catch (error) {
      console.error(`MongoDB connect attempt ${attempt} failed:`, error.message)
      if (attempt === maxAttempts) {
        console.error('Could not connect to MongoDB after multiple attempts.')
        process.exit(1)
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

module.exports = connectDb
