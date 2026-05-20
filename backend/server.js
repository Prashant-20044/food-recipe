const express=require("express")
const app=express()
const path=require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../.env") })
const connectDb=require("./config/connectionDb")
const cors=require("cors")

const PORT=process.env.PORT || 3000
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

// Serve static assets (images, profiles etc.)
// Use a default image MIME type when files have missing extensions (uploaded by multer without extension).
app.use(express.static(path.join(__dirname, "public"), {
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
app.use("/chatbot", require("./routes/chatbot"))

// Serve frontend build output from the backend
const frontendDist = path.join(__dirname, "..", "frontend", "food-app", "dist")
app.use(express.static(frontendDist))
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"))
})

connectDb().then(() => {
    const server = app.listen(PORT,()=>{
        console.log(`app is listening on port ${PORT}`)
    })

    server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
            console.error(`Port ${PORT} is already in use. Stop the other backend process or set a different PORT in .env.`)
            process.exit(1)
        }

        console.error("Failed to start server:", error.message)
        process.exit(1)
    })
})
