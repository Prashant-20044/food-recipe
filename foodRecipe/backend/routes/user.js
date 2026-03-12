const express = require("express")
const multer = require("multer")
const router = express.Router()
const { userLogin, userSignUp, getUser, getUserByUsername } = require("../controller/user")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/profiles')
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

module.exports = router