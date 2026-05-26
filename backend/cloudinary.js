const cloudinary = require('cloudinary').v2
const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

if (process.env.CLOUDINARY_URL) {
  const matches = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/(.+?):(.+?)@(.+)$/)
  if (matches) {
    cloudinary.config({
      cloud_name: matches[3],
      api_key: matches[1],
      api_secret: matches[2],
    })
  } else {
    throw new Error('Invalid CLOUDINARY_URL format')
  }
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// Validate configuration and log helpful message when missing
if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
  console.warn('Cloudinary is not fully configured. Check CLOUDINARY_URL or CLOUDINARY_* env vars.')
} else {
  console.log('Cloudinary configured for cloud:', cloudinary.config().cloud_name)
}

module.exports = cloudinary
