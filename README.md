# TasteNest - Interactive Food Recipe Platform

## 📖 Overview
TasteNest is a full-stack, real-time food recipe platform built with the modern MERN (MongoDB, Express, React, Node.js) stack. It goes beyond traditional recipe sharing by integrating an AI chatbot for culinary assistance and real-time WebRTC video calling, allowing users to connect, cook together, and share their culinary journeys live.
## TRY IT ON-https://food-recipe-fgub.onrender.com/
## ✨ Features
- **User Authentication & Authorization**: Secure login and registration using JWT and Google OAuth integration. Role-based access control with protected routes.
- **Recipe Management (CRUD)**: Easily create, read, update, and delete delicious recipes.
- **Real-Time Video Calling (WebRTC)**: Connect with other food enthusiasts via high-quality, peer-to-peer video calls directly within the app, powered by WebRTC and a custom Socket.io signaling server.
- **AI Culinary Assistant (Chatbot)**: Get instant cooking tips, recipe substitutions, and culinary advice from the integrated AI chatbot (rendered beautifully with Markdown).
- **Live Chat & Messaging**: Real-time messaging system using Socket.io to keep connected with other users.
- **Media Management**: Seamless image and media upload management utilizing Cloudinary and Multer.
- **Modern UI/UX**: Fully responsive, premium design featuring glassmorphism, dynamic animations, and warm-toned aesthetics built with custom CSS.

## 💻 Tech Stack
**Frontend:**
- React (Vite)
- React Router DOM
- Socket.io-client
- React Markdown

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.io (Signaling Server)
- WebRTC (with TURN server integration)
- Cloudinary & Multer (Media Storage)
- JWT, Bcrypt, Google Auth Library



## 📸 Screenshots

### Landing Page
![Landing Page](Screenshot%202026-06-03%20211325.png)

### Recipe Details
![Recipe Details](Screenshot%202026-06-03%20211349.png)

### AI Chatbot
![AI Chatbot](Screenshot%202026-06-03%20211440.png)

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed and running locally or via MongoDB Atlas
- Cloudinary Account (for media uploads)
- Google OAuth Credentials (for Google Login)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tastenest.git
   cd tastenest
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the root directory (or backend directory as configured) with your secrets:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   FRONTEND_URL=http://localhost:5173
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend/food-app
   npm install
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

