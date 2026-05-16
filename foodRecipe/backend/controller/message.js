const mongoose = require("mongoose")
const Message = require("../models/message")
const User = require("../models/user")

const sendMessage = async (req, res) => {
  const recipientId = req.params.id
  const senderId = req.user?.id
  const { text } = req.body

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Message text is required" })
  }

  if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
    return res.status(400).json({ error: "Invalid recipient id" })
  }

  if (senderId === recipientId) {
    return res.status(400).json({ error: "Cannot send messages to yourself" })
  }

  const recipient = await User.findById(recipientId)
  if (!recipient) {
    return res.status(404).json({ error: "Recipient not found" })
  }

  const message = await Message.create({
    sender: senderId,
    recipient: recipientId,
    text: text.trim(),
  })

  // Return the newly created message with sender populated so the frontend can use it immediately
  const populated = await Message.findById(message._id).populate(
    "sender",
    "_id username email profilePic"
  )

  res.status(201).json(populated)
}

const getConversation = async (req, res) => {
  const otherId = req.params.id
  const myId = req.user?.id

  if (!otherId || !mongoose.isValidObjectId(otherId)) {
    return res.status(400).json({ error: "Invalid user id" })
  }

  const otherUser = await User.findById(otherId)
  if (!otherUser) {
    return res.status(404).json({ error: "User not found" })
  }

  const messages = await Message.find({
    $or: [
      { sender: myId, recipient: otherId },
      { sender: otherId, recipient: myId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender", "_id username email profilePic")

  res.json(messages)
}

const getConversations = async (req, res) => {
  const myId = req.user?.id

  const messages = await Message.find({
    $or: [{ sender: myId }, { recipient: myId }],
  })
    .sort({ createdAt: -1 })
    .populate("sender", "_id username email profilePic")
    .populate("recipient", "_id username email profilePic")

  const seen = new Map()
  const conversations = []

  for (const msg of messages) {
    const other = msg.sender._id.toString() === myId ? msg.recipient : msg.sender
    const otherId = other._id.toString()

    if (seen.has(otherId)) continue

    seen.set(otherId, true)
    conversations.push({
      user: other,
      lastMessage: msg,
    })
  }

  res.json({ conversations })
}

module.exports = { sendMessage, getConversation, getConversations }
