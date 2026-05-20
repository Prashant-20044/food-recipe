const mongoose = require("mongoose")
const User = require("../models/user")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const userSignUp = async (req, res) => {
    try {
        const { username, email, password } = req.body
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required" })
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] })
        if (existing) {
            return res.status(400).json({ message: "Username or email already exists" })
        }

        const hashPwd = await bcrypt.hash(password, 10)
        const newUser = await User.create({
            username,
            email,
            password: hashPwd,
            profilePic: req.file?.filename || ""
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
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({
                username: user.username,
                email: user.email,
                id: user._id,
                profilePic: user.profilePic
            }, process.env.SECRET_KEY)

            const safeUser = {
                _id: user._id,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic
            }
            return res.status(200).json({ token, user: safeUser })
        }

        return res.status(401).json({ message: "Invalid credentials" })
    } catch (err) {
        return res.status(500).json({ message: err.message || "Unable to login" })
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
        if (receiver.followers?.includes(senderId)) {
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
        if (!user.followers?.includes(senderId)) {
            user.followers.push(senderId)
        }
        if (!sender.following?.includes(userId)) {
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
    getUser, 
    getUserByUsername, 
    sendFollowRequest,
    getFollowRequests,
    acceptFollowRequest,
    denyFollowRequest,
    removeFollower,
    unfollowUser,
    getFollowersFollowing
}
