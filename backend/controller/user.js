const mongoose = require("mongoose")
const User = require("../models/user")
const EmailVerification = require("../models/emailVerification")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const { OAuth2Client } = require("google-auth-library")
const nodemailer = require("nodemailer")
const cloudinary = require("../cloudinary")
const streamifier = require("streamifier")
const fs = require('fs')
const path = require('path')
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const createAuthResponse = (user) => {
    const token = jwt.sign({
        username: user.username,
        email: user.email,
        id: user._id,
        profilePic: user.profilePic
    }, process.env.SECRET_KEY)

    return {
        token,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic
        }
    }
}

const createGoogleUsername = async (name, email) => {
    const base = String(name || email?.split("@")[0] || "user")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 18) || "user"

    let username = base
    let suffix = 0

    while (await User.findOne({ username })) {
        suffix += 1
        username = `${base}${suffix}`
    }

    return username
}

const normalizeEmail = (email) => String(email || "").trim().toLowerCase()
const hashVerificationCode = (email, code) => {
    return crypto
        .createHash("sha256")
        .update(`${normalizeEmail(email)}:${code}:${process.env.SECRET_KEY}`)
        .digest("hex")
}
const createMailTransport = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    })
}

const sendVerificationCode = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email)
        const username = String(req.body.username || "").trim()

        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: "Enter a valid email address" })
        }

        if (username && await User.findOne({ username })) {
            return res.status(400).json({ message: "Username already exists" })
        }

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: "Email already exists" })
        }

        const transport = createMailTransport()
        if (!transport) {
            return res.status(500).json({ message: "Email verification is not configured. Add SMTP settings to .env." })
        }

        const code = String(crypto.randomInt(100000, 1000000))
        await EmailVerification.findOneAndUpdate(
            { email, purpose: "signup" },
            {
                email,
                purpose: "signup",
                codeHash: hashVerificationCode(email, code),
                attempts: 0,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        await transport.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: "Your TasteNest verification code",
            text: `Your TasteNest verification code is ${code}. It expires in 10 minutes.`,
            html: `<p>Your TasteNest verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
        })

        return res.json({ message: "Verification code sent. Check your email." })
    } catch (err) {
        return res.status(500).json({ message: err.message || "Unable to send verification code" })
    }
}

const verifySignupCode = async (email, code) => {
    const verification = await EmailVerification.findOne({ email, purpose: "signup" })
    if (!verification || verification.expiresAt <= new Date()) {
        return { ok: false, message: "Verification code expired. Request a new code." }
    }

    if (verification.attempts >= 5) {
        return { ok: false, message: "Too many incorrect code attempts. Request a new code." }
    }

    if (verification.codeHash !== hashVerificationCode(email, String(code || "").trim())) {
        verification.attempts += 1
        await verification.save()
        return { ok: false, message: "Invalid verification code" }
    }

    await EmailVerification.deleteOne({ _id: verification._id })
    return { ok: true }
}

const uploadToCloudinary = (buffer, folder) => new Promise((resolve, reject) => {
    if (!buffer) return reject(new Error('No buffer provided for upload'))

    const cloudConf = cloudinary.config()
    if (!cloudConf.cloud_name || !cloudConf.api_key || !cloudConf.api_secret) {
        try {
            const imagesDir = path.join(__dirname, '..', 'public', 'images')
            if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true })
            const filename = `${Date.now()}-upload.jpg`
            const filePath = path.join(imagesDir, filename)
            fs.writeFileSync(filePath, buffer)
            return resolve({ localPath: filename })
        } catch (err) {
            console.error('Failed to save image locally:', err)
            return reject(new Error('Failed to save image locally: ' + err.message))
        }
    }

    const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result) => {
            if (error) {
                console.error('Cloudinary upload error:', error)
                return reject(new Error('Cloudinary upload failed: ' + (error.message || error)))
            }
            resolve(result)
        }
    )
    try {
        streamifier.createReadStream(buffer).pipe(stream)
    } catch (err) {
        console.error('Error streaming buffer to Cloudinary:', err)
        return reject(new Error('Error streaming buffer to Cloudinary: ' + err.message))
    }
})

const userSignUp = async (req, res) => {
    try {
        const { username, password, verificationCode } = req.body
        const email = normalizeEmail(req.body.email)
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required" })
        }
        if (!emailPattern.test(email)) {
            return res.status(400).json({ message: "Enter a valid email address" })
        }
        if (!verificationCode) {
            return res.status(400).json({ message: "Email verification code is required" })
        }

        const existingUsername = await User.findOne({ username })
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists" })
        }

        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" })
        }

        const codeResult = await verifySignupCode(email, verificationCode)
        if (!codeResult.ok) {
            return res.status(400).json({ message: codeResult.message })
        }

        const hashPwd = await bcrypt.hash(password, 10)
                let profilePicUrl = ""
                if (req.file?.buffer) {
                        try {
                            const uploadResult = await uploadToCloudinary(req.file.buffer, "foodRecipeApp/profiles")
                            profilePicUrl = uploadResult?.secure_url || uploadResult?.localPath || ""
                        } catch (err) {
                            console.error('Profile pic upload failed:', err.message || err)
                            return res.status(500).json({ message: 'Profile image upload failed', error: err.message || err })
                        }
                }

        const newUser = await User.create({
            username,
            email,
            password: hashPwd,
            profilePic: profilePicUrl
        })

        const token = jwt.sign({
            username: newUser.username,
            email: newUser.email,
            id: newUser._id,
            profilePic: newUser.profilePic
        }, process.env.SECRET_KEY)

        const safeUser = {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            profilePic: newUser.profilePic
        }

        return res.status(200).json({ token, user: safeUser })
    } catch (err) {
        return res.status(500).json({ message: err.message || "Unable to create user" })
    }
}

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" })
        }

        const user = await User.findOne({ email })
        if (user?.password && await bcrypt.compare(password, user.password)) {
            return res.status(200).json(createAuthResponse(user))
        }

        return res.status(401).json({ message: "Invalid credentials" })
    } catch (err) {
        return res.status(500).json({ message: err.message || "Unable to login" })
    }
}

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body

        if (!credential) {
            return res.status(400).json({ message: "Google credential is required" })
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({ message: "Google login is not configured" })
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        const payload = ticket.getPayload()

        if (!payload?.email || !payload?.email_verified) {
            return res.status(401).json({ message: "Google account email is not verified" })
        }

        let user = await User.findOne({ email: payload.email })

        if (user) {
            user.googleId = user.googleId || payload.sub
            user.authProvider = user.authProvider || "google"
            user.profilePic = user.profilePic || payload.picture || ""
            await user.save()
        } else {
            user = await User.create({
                username: await createGoogleUsername(payload.name, payload.email),
                email: payload.email,
                googleId: payload.sub,
                authProvider: "google",
                profilePic: payload.picture || ""
            })
        }

        return res.status(200).json(createAuthResponse(user))
    } catch (err) {
        return res.status(401).json({ message: err.message || "Google login failed" })
    }
}

const updateProfilePhoto = async (req, res) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!req.file?.buffer) {
            return res.status(400).json({ message: "Profile photo is required" })
        }

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const uploadResult = await uploadToCloudinary(req.file.buffer, "foodRecipeApp/profiles")
        user.profilePic = uploadResult?.secure_url || uploadResult?.localPath || user.profilePic
        await user.save()

        return res.json(createAuthResponse(user))
    } catch (err) {
        return res.status(500).json({ message: err.message || "Unable to update profile photo" })
    }
}

const getUser = async (req, res) => {
    const { id } = req.params
    if (!id || !mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid user id" })
    }

    const user = await User.findById(id)
    if (!user) {
        return res.status(404).json({ error: "User not found" })
    }

    res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0
    })
}

const getUserByUsername = async (req, res) => {
    const { username } = req.params
    if (!username) {
        return res.status(400).json({ error: "Username is required" })
    }

    const user = await User.findOne({ username })
    if (!user) {
        return res.status(404).json({ error: "User not found" })
    }

    res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0
    })
}

const searchUsers = async (req, res) => {
    try {
        const query = String(req.query.q || "").trim()
        if (!query) {
            return res.json([])
        }

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const users = await User.find({
            username: { $regex: escapedQuery, $options: "i" }
        })
            .select("_id username email profilePic")
            .sort({ username: 1 })
            .limit(8)

        res.json(users)
    } catch (err) {
        res.status(500).json({ error: err.message || "Unable to search users" })
    }
}

const sendFollowRequest = async (req, res) => {
    try {
        const senderId = req.user?.id
        const receiverId = req.params.id

        if (!senderId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
            return res.status(400).json({ error: "Invalid user id" })
        }

        if (senderId === receiverId) {
            return res.status(400).json({ error: "Cannot send follow request to yourself" })
        }

        const receiver = await User.findById(receiverId)
        if (!receiver) {
            return res.status(404).json({ error: "User not found" })
        }

        // Check if already following
        if (receiver.followers?.some(id => id.toString() === senderId)) {
            return res.status(400).json({ error: "Already following this user" })
        }

        // Check if request already exists
        const existingRequest = receiver.followRequests?.find(req => req.from.toString() === senderId)
        if (existingRequest) {
            return res.status(400).json({ error: "Follow request already sent" })
        }

        receiver.followRequests.push({
            from: senderId,
            status: 'pending'
        })
        await receiver.save()

        res.status(201).json({ message: "Follow request sent successfully" })
    } catch (err) {
        res.status(500).json({ error: err.message || "Unable to send follow request" })
    }
}

const getFollowRequests = async (req, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const user = await User.findById(userId)
            .populate('followRequests.from', '_id username email profilePic')

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const pendingRequests = user.followRequests?.filter(req => req.status === 'pending') || []

        res.json(pendingRequests)
    } catch (err) {
        res.status(500).json({ error: err.message || "Unable to fetch follow requests" })
    }
}

const acceptFollowRequest = async (req, res) => {
    try {
        const userId = req.user?.id
        const senderId = req.params.id

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!senderId || !mongoose.isValidObjectId(senderId)) {
            return res.status(400).json({ error: "Invalid sender id" })
        }

        const user = await User.findById(userId)
        const sender = await User.findById(senderId)

        if (!user || !sender) {
            return res.status(404).json({ error: "User not found" })
        }

        // Find and accept the request
        const requestIndex = user.followRequests?.findIndex(req => req.from.toString() === senderId)
        if (requestIndex === -1) {
            return res.status(400).json({ error: "Follow request not found" })
        }

        user.followRequests[requestIndex].status = 'accepted'

        // Add sender to user's followers and user to sender's following
        if (!user.followers?.some(id => id.toString() === senderId)) {
            user.followers.push(senderId)
        }
        if (!sender.following?.some(id => id.toString() === userId)) {
            sender.following.push(userId)
        }

        await user.save()
        await sender.save()

        res.json({ message: "Follow request accepted" })
    } catch (err) {
        res.status(500).json({ error: err.message || "Unable to accept follow request" })
    }
}

const denyFollowRequest = async (req, res) => {
    try {
        const userId = req.user?.id
        const senderId = req.params.id

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!senderId || !mongoose.isValidObjectId(senderId)) {
            return res.status(400).json({ error: "Invalid sender id" })
        }

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        // Remove the request
        const requestIndex = user.followRequests?.findIndex(req => req.from.toString() === senderId)
        if (requestIndex === -1) {
            return res.status(400).json({ error: "Follow request not found" })
        }

        user.followRequests.splice(requestIndex, 1)
        await user.save()

        res.json({ message: "Follow request denied" })
    } catch (err) {
        res.status(500).json({ error: err.message || "Unable to deny follow request" })
    }
}

const removeFollower = async (req, res) => {
    try {
        const userId = req.user?.id
        const followerId = req.params.id

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!followerId || !mongoose.isValidObjectId(followerId)) {
            return res.status(400).json({ error: "Invalid follower id" })
        }

        const user = await User.findById(userId)
        const follower = await User.findById(followerId)

        if (!user || !follower) {
            return res.status(404).json({ error: "User not found" })
        }

        // Remove follower from user's followers
        user.followers = user.followers?.filter(id => id.toString() !== followerId)
        // Remove user from follower's following
        follower.following = follower.following?.filter(id => id.toString() !== userId)

        await user.save()
        await follower.save()

        res.json({ message: "Follower removed" })
    } catch (err) {
        res.status(500).json({ error: err.message || "Unable to remove follower" })
    }
}

const unfollowUser = async (req, res) => {
    try {
        const userId = req.user?.id
        const followingId = req.params.id

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!followingId || !mongoose.isValidObjectId(followingId)) {
            return res.status(400).json({ error: "Invalid user id" })
        }

        const user = await User.findById(userId)
        const followingUser = await User.findById(followingId)

        if (!user || !followingUser) {
            return res.status(404).json({ error: "User not found" })
        }

        // Remove from user's following
        user.following = user.following?.filter(id => id.toString() !== followingId)
        // Remove from followingUser's followers
        followingUser.followers = followingUser.followers?.filter(id => id.toString() !== userId)

        await user.save()
        await followingUser.save()

        res.json({ message: "Unfollowed successfully" })
    } catch (err) {
        res.status(500).json({ error: err.message || "Unable to unfollow user" })
    }
}

const getFollowersFollowing = async (req, res) => {
    try {
        const { id } = req.params

        if (!id || !mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid user id" })
        }

        const user = await User.findById(id)
            .populate('followers', '_id username profilePic')
            .populate('following', '_id username profilePic')

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        res.json({
            followers: user.followers || [],
            following: user.following || []
        })
    } catch (err) {
        res.status(500).json({ error: err.message || "Unable to fetch followers/following" })
    }
}

module.exports = { 
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
}
