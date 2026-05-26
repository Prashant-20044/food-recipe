const mongoose = require('mongoose')
const fs = require('fs')
const env = fs.readFileSync(require('path').resolve(__dirname, '../.env'), 'utf8')
const m = env.match(/CONNECTION_STRING=(.*)/)
const conn = m[1].trim()
const schema = new mongoose.Schema({}, { strict: false, collection: 'recipes' })
const Recipes = mongoose.model('Recipes', schema)

;(async () => {
  try {
    await mongoose.connect(conn, { useNewUrlParser: true, useUnifiedTopology: true })
    const docs = await Recipes.find().limit(5).lean()
    console.log(docs.map(d => ({ _id: d._id, title: d.title, coverImage: d.coverImage })))
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
})()
