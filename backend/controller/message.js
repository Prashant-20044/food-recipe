const mongoose = require("mongoose")
const Message = require("../models/message")
const User = require("../models/user")

const sendMessage = async (req, res) => {
  const senderId = req.user?.id
  const recipientId = req.params.id
  const { text } = req.body

  if (!senderId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
    return res.status(400).json({ error: "Invalid recipient id" })
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Message text is required" })
  }

  if (senderId === recipientId) {
    return res.status(400).json({ error: "Cannot send messages to yourself" })
  }

  const sender = await User.findById(senderId)
  const recipient = await User.findById(recipientId)
  
  if (!recipient) {
    return res.status(404).json({ error: "Recipient not found" })
  }

  // Check if sender is following recipient
  const isFollowing = sender.following?.includes(recipientId)
  if (!isFollowing) {
    return res.status(403).json({ 
      error: "You must follow this user to send messages. Please send a follow request first." 
    })
  }

  const message = await Message.create({
    sender: senderId,
    recipient: recipientId,
    text: text.trim(),
  })

  const populated = await Message.findById(message._id)
    .populate("sender", "_id username email profilePic")
    .populate("recipient", "_id username email profilePic")

  res.status(201).json(populated)
}

const getConversation = async (req, res) => {
  const userId = req.user?.id
  const otherUserId = req.params.id

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  if (!otherUserId || !mongoose.isValidObjectId(otherUserId)) {
    return res.status(400).json({ error: "Invalid user id" })
  }

  const otherUser = await User.findById(otherUserId)
  if (!otherUser) {
    return res.status(404).json({ error: "User not found" })
  }

  const messages = await Message.find({
    $or: [
      { sender: userId, recipient: otherUserId },
      { sender: otherUserId, recipient: userId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate("sender", "username profilePic email")
    .populate("recipient", "username profilePic email")

  res.json(messages)
}

const getConversations = async (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const userObjId = new mongoose.Types.ObjectId(userId)

  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: userObjId }, { recipient: userObjId }] } },
    {
      $project: {
        otherUser: {
          $cond: [
            { $eq: ["$sender", userObjId] },
            "$recipient",
            "$sender"
          ]
        },
        sender: 1,
        recipient: 1,
        text: 1,
        createdAt: 1
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$otherUser",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$recipient", userObjId] },
                  { $ne: ["$sender", userObjId] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalMessages: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        user: {
          _id: "$user._id",
          username: "$user.username",
          email: "$user.email",
          profilePic: "$user.profilePic"
        },
        lastMessage: {
          text: "$lastMessage.text",
          sender: "$lastMessage.sender",
          recipient: "$lastMessage.recipient",
          createdAt: "$lastMessage.createdAt"
        },
        unreadCount: 1,
        totalMessages: 1
      }
    }
  ])

  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)

  res.json({ conversations, unreadCount: totalUnread })
}

module.exports = { sendMessage, getConversation, getConversations }
