const express = require("express")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const router = express.Router()
const { 
    userLogin, 
    userSignUp, 
    getUser, 
    getUserByUsername,
    sendFollowRequest,
    getFollowRequests,
    acceptFollowRequest,
    denyFollowRequest,
    removeFollower,
    unfollowUser,
    getFollowersFollowing
} = require("../controller/user")
const verifyToken = require("../middleware/auth")

const profileUploadDir = path.join(__dirname, "../public/profiles")
fs.mkdirSync(profileUploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profileUploadDir)
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + '-' + file.fieldname + (file.originalname ? '-' + file.originalname : '')
        cb(null, filename)
    }
})

const upload = multer({ storage: storage })

router.post("/signUp", upload.single('profilePic'), userSignUp)
router.post("/login", userLogin)
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
