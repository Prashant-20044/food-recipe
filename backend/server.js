const express=require("express")
const app=express()
const http=require("http")
const socketIO=require("socket.io")
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
app.use("/api/turn", require("./routes/turn"))

// Serve frontend build output from the backend
const frontendDist = path.join(__dirname, "..", "frontend", "food-app", "dist")
app.use(express.static(frontendDist))
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"))
})

connectDb().then(() => {
    const server = http.createServer(app)
    
    // Initialize Socket.IO
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL
    ].filter(Boolean)

    const io = socketIO(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
      }
    })

    // Store active users and their socket IDs
    const activeUsers = new Map()

    // Socket.IO connection handling
    io.on("connection", (socket) => {
      console.log("User connected:", socket.id)

      // User joins
      socket.on("user-join", (userData) => {
        const { userId, username } = userData
        activeUsers.set(userId, { socketId: socket.id, username })
        console.log(`User ${username} joined with socket ID: ${socket.id}`)
        
        // Broadcast online users
        io.emit("users-online", Array.from(activeUsers.values()).map(user => ({
          userId: Array.from(activeUsers.keys())[Array.from(activeUsers.values()).indexOf(user)],
          username: user.username
        })))
      })

      // Initiate call
      socket.on("call-user", (data) => {
        const { recipientId, callerId, callerName, roomId } = data
        const recipient = activeUsers.get(recipientId)
        
        if (recipient) {
          io.to(recipient.socketId).emit("incoming-call", {
            callerId,
            callerName,
            callerSocketId: socket.id,
            roomId
          })
          console.log(`Call from ${callerName} to ${recipient.username}`)
        } else {
          socket.emit("user-offline", { recipientId })
        }
      })

      // Accept call
      socket.on("accept-call", (data) => {
        const { callerId, roomId } = data
        const caller = activeUsers.get(callerId)
        const recipientId = Array.from(activeUsers.entries()).find(([, user]) => user.socketId === socket.id)?.[0]
        
        if (caller) {
          io.to(caller.socketId).emit("call-accepted", {
            recipientId,
            roomId
          })
          console.log(`Call accepted by user`)
        }
      })

      // Decline call
      socket.on("decline-call", (data) => {
        const { callerId } = data
        const caller = activeUsers.get(callerId)
        
        if (caller) {
          io.to(caller.socketId).emit("call-declined")
          console.log(`Call declined`)
        }
      })

      // End call
      socket.on("end-call", (data) => {
        const { recipientId } = data
        const recipient = activeUsers.get(recipientId)
        
        if (recipient) {
          io.to(recipient.socketId).emit("call-ended")
          io.to(recipient.socketId).emit("call-cancelled")
          console.log(`Call ended`)
        }
      })

      // ─── WebRTC Signaling ───────────────────────────────────

      // Relay SDP offer from caller to recipient
      socket.on("webrtc-offer", (data) => {
        const { recipientId, offer } = data
        const senderId = [...activeUsers.entries()].find(([, u]) => u.socketId === socket.id)?.[0]
        const recipient = activeUsers.get(recipientId)
        console.log(`[WebRTC] Offer from ${senderId} to ${recipientId}`, recipient ? '→ relayed' : '→ recipient not found')
        if (recipient) {
          io.to(recipient.socketId).emit("webrtc-offer", { offer, callerId: senderId })
        }
      })

      // Relay SDP answer from recipient to caller
      socket.on("webrtc-answer", (data) => {
        const { recipientId, answer } = data
        const recipient = activeUsers.get(recipientId)
        console.log(`[WebRTC] Answer to ${recipientId}`, recipient ? '→ relayed' : '→ recipient not found')
        if (recipient) {
          io.to(recipient.socketId).emit("webrtc-answer", { answer })
        }
      })

      // Relay ICE candidates between peers
      socket.on("ice-candidate", (data) => {
        const { recipientId, candidate } = data
        const recipient = activeUsers.get(recipientId)
        if (recipient) {
          io.to(recipient.socketId).emit("ice-candidate", { candidate })
        }
      })

      // User disconnect
      socket.on("disconnect", () => {
        let disconnectedUserId
        for (const [userId, user] of activeUsers.entries()) {
          if (user.socketId === socket.id) {
            disconnectedUserId = userId
            activeUsers.delete(userId)
            break
          }
        }
        
        console.log("User disconnected:", socket.id)
        
        // Broadcast updated online users
        io.emit("users-online", Array.from(activeUsers.values()).map(user => ({
          userId: Array.from(activeUsers.keys())[Array.from(activeUsers.values()).indexOf(user)],
          username: user.username
        })))
      })
    })

    server.listen(PORT, () => {
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
