const express = require("express")
const router = express.Router()

/**
 * GET /api/turn/credentials
 * 
 * Returns ICE server configuration (STUN + TURN) for WebRTC.
 * If TURN credentials are configured via env vars, includes TURN servers.
 * Always includes free Google STUN servers.
 * 
 * Supported TURN providers (set via env vars):
 *   - Metered.ca: TURN_SERVER_URL, TURN_USERNAME, TURN_CREDENTIAL
 *   - Or any standard TURN server with the same env vars
 */
router.get("/credentials", (req, res) => {
  const iceServers = [
    // Free Google STUN servers (always included)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" }
  ]

  // Add TURN servers if configured
  const turnUrl = process.env.TURN_SERVER_URL
  const turnUser = process.env.TURN_USERNAME
  const turnCred = process.env.TURN_CREDENTIAL

  if (turnUrl && turnUser && turnCred) {
    // Support comma-separated multiple TURN URLs
    const turnUrls = turnUrl.split(",").map((u) => u.trim()).filter(Boolean)

    iceServers.push({
      urls: turnUrls,
      username: turnUser,
      credential: turnCred
    })

    console.log("[TURN] Serving TURN credentials for:", turnUrls.join(", "))
  }

  res.json({ iceServers })
})

module.exports = router
