const mongoose = require("mongoose")

const recipeSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    ingredients: {
        type: Array,
        required: true
    },
    instructions: {
        type: String,
        required: true
    },
    time: {
        type: String,
    },
    category: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            username: {
                type: String
            },
            profilePic: {
                type: String
            },
            email: {
                type: String
            },
            text: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    ratings: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            value: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            }
        }
    ]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

recipeSchema.virtual("avgRating").get(function () {
    if (!this.ratings || this.ratings.length === 0) return 0
    const sum = this.ratings.reduce((acc, r) => acc + (r.value || 0), 0)
    return Number((sum / this.ratings.length).toFixed(1))
})

module.exports = mongoose.model("Recipes", recipeSchema)