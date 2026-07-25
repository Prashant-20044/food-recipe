# 🍲 TasteNest - Interactive Food Recipe Platform

[![Deployment Status](https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://food-recipe-fgub.onrender.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)]()
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)]()
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)]()

## 📖 Overview
**TasteNest** is a full-stack, real-time food recipe platform built with the modern MERN stack. It goes beyond traditional recipe sharing by integrating an **AI chatbot** for culinary assistance and **real-time WebRTC video calling**, allowing users to connect, cook together, and share their culinary journeys live.

👉 **[Try the Live Demo on Render](https://food-recipe-fgub.onrender.com/)**

---

## ✨ Features
- **User Authentication & Authorization**: Secure login and registration using JWT and Google OAuth integration. Role-based access control with protected routes.
- **Recipe Management (CRUD)**: Easily create, read, update, and delete delicious recipes.
- **Real-Time Video Calling (WebRTC)**: Connect with other food enthusiasts via high-quality, peer-to-peer video calls directly within the app, powered by WebRTC and a custom Socket.io signaling server.
- **AI Culinary Assistant (Chatbot)**: Get instant cooking tips, recipe substitutions, and culinary advice from the integrated AI chatbot (rendered beautifully with Markdown).
- **Live Chat & Messaging**: Real-time messaging system using Socket.io to keep connected with other users.
- **Media Management**: Seamless image and media upload management utilizing Cloudinary and Multer.
- **Modern UI/UX**: Fully responsive, premium design featuring glassmorphism, dynamic animations, and warm-toned aesthetics built with custom CSS.

---

## 💻 Tech Stack
| Frontend | Backend | DevOps & Infrastructure |
| :--- | :--- | :--- |
| • React (Vite)<br>• React Router DOM<br>• Socket.io-client<br>• React Markdown | • Node.js & Express.js<br>• MongoDB & Mongoose<br>• WebRTC (TURN servers)<br>• Cloudinary & Multer<br>• JWT, Bcrypt, Google Auth | • Docker & Docker Compose<br>• GitHub Actions (CI/CD)<br>• Render (Deployment)<br>• NGINX (Static Serving) |

---

## 📸 Screenshots

### Landing Page
![Landing Page](Screenshot%202026-06-03%20211325.png)

### Recipe Details
![Recipe Details](Screenshot%202026-06-03%20211349.png)

### AI Chatbot
![AI Chatbot](Screenshot%202026-06-03%20211440.png)

---

## 🚀 Getting Started

### Option 1: Run with Docker (Recommended)
You can start the entire application (Frontend, Backend, and MongoDB) with a single command using Docker.

**Prerequisites:**
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) installed on your machine.

```bash
# 1. Clone the repository
git clone https://github.com/Prashant-20044/food-recipe.git
cd food-recipe

# 2. Start the application
docker-compose up --build -d
```
*The frontend will be available at `http://localhost` and the backend API at `http://localhost:5000`.*

---

### Option 2: Run Manually (Local Development)

**Prerequisites:** Node.js, local MongoDB or MongoDB Atlas URI, Cloudinary account, Google OAuth credentials.

#### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Prashant-20044/food-recipe.git
cd food-recipe
```

#### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `/backend` directory:
```env
PORT=5000
CONNECTION_STRING=mongodb://localhost:27017/foodrecipe
SECRET_KEY=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
FRONTEND_URL=http://localhost:5173
```
```bash
# Start backend server
npm run dev
```

#### 3. Frontend Setup
```bash
# Open a new terminal
cd frontend/food-app
npm install

# Start frontend server
npm run dev
```

---

## 🏗️ CI/CD Pipeline
This project utilizes **GitHub Actions** for Continuous Integration. On every push to the `main` branch, the pipeline automatically:
1. Installs all frontend and backend dependencies.
2. Runs static code analysis (Linting) to enforce code quality.
3. Builds the Docker images to verify production readiness.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Prashant-20044/food-recipe/issues).

---
*Built with ❤️ by [Prashant](https://github.com/Prashant-20044)*
