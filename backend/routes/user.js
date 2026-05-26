const express = require("express")
const multer = require("multer")
const path = require("path")
const router = express.Router()
const { 
    userLogin, 
    userSignUp, 
    sendVerificationCode,
    googleLogin,
    updateProfilePhoto,
    getUser, 
    getUserByUsername,
    searchUsers,
    sendFollowRequest,
    getFollowRequests,
    acceptFollowRequest,
    denyFollowRequest,
    removeFollower,
    unfollowUser,
    getFollowersFollowing
} = require("../controller/user")
const verifyToken = require("../middleware/auth")

const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post("/signUp", upload.single('profilePic'), userSignUp)
router.post("/login", userLogin)
router.post("/send-verification-code", sendVerificationCode)
router.post("/google-login", googleLogin)
router.patch("/profile/photo", verifyToken, upload.single('profilePic'), updateProfilePhoto)
router.get("/user/search", searchUsers)
router.get("/user/:id", getUser)
router.get("/user/username/:username", getUserByUsername)

// Follow routes
router.post("/follow/:id", verifyToken, sendFollowRequest)
router.get("/follow-requests", verifyToken, getFollowRequests)
router.post("/follow-request/accept/:id", verifyToken, acceptFollowRequest)
router.post("/follow-request/deny/:id", verifyToken, denyFollowRequest)
router.post("/remove-follower/:id", verifyToken, removeFollower)
router.post("/unfollow/:id", verifyToken, unfollowUser)
router.get("/followers-following/:id", getFollowersFollowing)

module.exports = router
