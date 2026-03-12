const express=require("express")
const app=express()
const dotenv=require("dotenv").config()
const connectDb=require("./config/connectionDb")
const cors=require("cors")

const PORT=process.env.PORT || 3000
connectDb()

app.use(express.json())
app.use(cors())

// Serve static assets (images, profiles etc.)
// Use a default image MIME type when files have missing extensions (uploaded by multer without extension).
app.use(express.static("public", {
  setHeaders: (res, filePath) => {
    if (filePath.includes("/images/") || filePath.includes("\\images\\")) {
      const ext = require('path').extname(filePath)
      if (!ext) {
        // default to JPEG for uploaded images without extension
        res.setHeader('Content-Type', 'image/jpeg')
      }
    }
  }
}))

app.use("/",require("./routes/user"))
app.use("/recipe",require("./routes/recipe"))
app.use("/message", require("./routes/message"))

app.listen(PORT,(err)=>{
    console.log(`app is listening on port ${PORT}`)
})