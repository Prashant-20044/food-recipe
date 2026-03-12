const mongoose = require("mongoose")
const User = require("../models/user")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const userSignUp = async (req, res) => {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" })
    }

    let existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
        return res.status(400).json({ error: "Username or email already exists" })
    }

    if (!req.file) {
        return res.status(400).json({ error: "Profile picture is required" })
    }

    const hashPwd = await bcrypt.hash(password, 10)
    const newUser = await User.create({
        username,
        email,
        password: hashPwd,
        profilePic: req.file.filename
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
}

const userLogin = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password is required" })
    }

    let user = await User.findOne({ email })
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
    } else {
        return res.status(400).json({ error: "Invalid credentials" })
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
        profilePic: user.profilePic
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
        profilePic: user.profilePic
    })
}

module.exports = { userLogin, userSignUp, getUser, getUserByUsername }