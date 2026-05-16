const mongoose = require('mongoose')

const connectDb = async () => {
  const uri = process.env.CONNECTION_STRING
  if (!uri) {
    throw new Error('Missing CONNECTION_STRING environment variable')
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('MongoDB connected')
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    process.exit(1)
  }
}

module.exports = connectDb
