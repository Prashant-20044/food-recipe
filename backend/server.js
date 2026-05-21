const express=require("express")
const app=express()
const path=require("path")
const fs=require("fs")
require("dotenv").config({ path: path.resolve(__dirname, "../.env") })
const connectDb=require("./config/connectionDb")
const cors=require("cors")

const PORT=process.env.PORT || 3000
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.use("/images", (req, res, next) => {
  const requestedPath = path.join(__dirname, "public", req.path)
  if (fs.existsSync(requestedPath)) {
    return next()
  }

  const parsed = path.parse(requestedPath)
  if (parsed.ext) {
    const fallbackPath = path.join(parsed.dir, parsed.name)
    if (fs.existsSync(fallbackPath)) {
      req.url = `/images/${parsed.name}`
      return next()
    }
  } else {
    const fallbackCandidates = [
      `${requestedPath}.jpg`,
      `${requestedPath}.jpeg`,
      `${requestedPath}.png`,
      `${requestedPath}.webp`,
      `${requestedPath}.avif`
    ]
    for (const candidate of fallbackCandidates) {
      if (fs.existsSync(candidate)) {
        req.url = `/images/${path.basename(candidate)}`
        return next()
      }
    }
  }

  const placeholderSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300">\n  <rect width="500" height="300" fill="#f4f4f4"/>\n  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial, sans-serif" font-size="24">Image not found</text>\n</svg>`
  return res.status(404).type("image/svg+xml").send(placeholderSvg)
})

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
