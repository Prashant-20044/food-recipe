<<<<<<< HEAD
# 🍳 Food Recipe Web Application

A full-stack, responsive web platform designed for culinary enthusiasts to discover, share, and manage recipes. This project was developed as part of a **Full-Stack Development Virtual Internship** at **Mainflow Services and Technology Pvt. Ltd**.

---

## 📸 Screenshots

![Landing Page](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-01-11%20221841.png)
*Landing page featuring the "Share your recipe" call-to-action.*

![Recipe Dashboard](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-01-11%20221912.png)
*Recipe dashboard showing various dishes with cook times and "favorite" functionality.*

![Add recipe](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-03-08%20145742.png)
*users can add recipe of their choice*

![login page](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-03-08%20145659.png)
*user can login*

![Recipe ](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-03-14%20011757.png)
*Full recipe details*

![comments](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-03-14%20011859.png)
*User can add comments*

![Profile](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-03-14%20011917.png)
*User Profile*


![Recipe ](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-03-14%20011757.png)
*Full recipe details*

![chats section](https://github.com/Prashant-20044/food-recipe/blob/main/Screenshot%202026-03-14%20011933.png)
*Chats section*


## ✨ Features

* **Recipe Discovery:** Browse a diverse collection of recipes with detailed metadata such as preparation and cook times.
* **User Authentication:** Secure login and sign-up functionality for a personalized user experience.
* **Recipe Management:** Users can add, edit, and delete their own recipes, and save others to a "Favorites" list.
* **Responsive Design:** Optimized for a seamless experience across mobile, tablet, and desktop devices.
* **Search & Filter:** Find recipes easily based on categories or ingredients.

---

## 🛠️ Tech Stack

This project utilizes the **MERN** stack and modern styling tools:

* **Frontend:** React.js, Tailwind CSS 
* **Backend:** Node.js, Express.js 
* **Database:** MongoDB 
* **Authentication:** JWT (JSON Web Tokens)
* **Version Control:** Git & GitHub 

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v16 or higher)
* MongoDB Atlas account or local MongoDB instance

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Prashant-20044/food-recipe.git](https://github.com/Prashant-20044/food-recipe.git)
    cd food-recipe
    ```

2.  **Install dependencies for both Client and Server:**
    ```bash
    # Install server dependencies
    npm install

    # Install client dependencies
    cd client
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add:
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    PORT=5000
    ```

4.  **Run the application:**
    ```bash
    # From the root directory
    npm run dev
    ```

---

## 📁 Project Structure

```text
├── client/                # React frontend (Tailwind CSS)
├── server/                # Node.js & Express backend
│   ├── models/            # Database schemas (MongoDB)
│   ├── routes/            # API endpoints
│   └── controllers/       # Logic for API routes
├── assets/                # Images and icons
└── README.md
=======
# Food Recipe App

This repository contains a full-stack food recipe application with:

- **Backend (Node.js + Express + MongoDB)** for authentication, recipes, comments, ratings, and messaging.
- **Frontend (React + Vite)** for browsing recipes, user profiles, messaging, and managing recipes.

---

## 🗂️ Project Structure

```
foodRecipeApp-main/
├─ foodRecipe/                   # Application root
│  ├─ backend/                   # Express API server
│  └─ frontend/food-blog-app/    # React/Vite frontend
```

---

## ✅ Prerequisites

- **Node.js** (>= 18 recommended)
- **npm** (comes with Node.js)
- **MongoDB** (local or cloud URI)

---

## 🔧 Configuration

### Backend (Express API)

1. Create a `.env` file inside `foodRecipe/backend/`.
2. Add the following environment variables:

```env
CONNECTION_STRING=<your-mongodb-connection-string>
SECRET_KEY=<your-jwt-secret>
PORT=5000
```

- `CONNECTION_STRING` should be a valid MongoDB URI (e.g. from MongoDB Atlas or local MongoDB).
- `SECRET_KEY` is a string used to sign JWT tokens (e.g., `mySuperSecretKey`).
- `PORT` is optional (default is 3000).

### Frontend (React / Vite)

The frontend already includes an `.env` file at:

`foodRecipe/frontend/food-blog-app/.env`

It points to the backend at `http://localhost:5000`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

If you run the backend on a different URL/port, update it accordingly.

---

## ▶️ Run the App (Development)

Open **two terminals** (one for backend, one for frontend):

### 1) Start the backend

```sh
cd foodRecipe/backend
npm install
npm run dev
```

### 2) Start the frontend

```sh
cd foodRecipe/frontend/food-blog-app
npm install
npm run dev
```

Then open the URL shown by Vite (usually `http://localhost:5173`).

---

## 📦 Available Scripts

### Backend (in `foodRecipe/backend`)

- `npm run dev` - Starts the server with `nodemon` for hot reload.

### Frontend (in `foodRecipe/frontend/food-blog-app`)

- `npm run dev` - Starts the Vite development server.
- `npm run build` - Builds a production bundle into `dist/`.
- `npm run preview` - Serves the production build locally.
- `npm run lint` - Runs ESLint.

---

## 🧠 Backend API Overview

### Auth
- `POST /signUp` - Create new user (expects form-data with `username`, `email`, `password`, and `profilePic` file).
- `POST /login` - Log in (expects JSON `{ email, password }`).

### Users
- `GET /user/:id` - Get user by ID.
- `GET /user/username/:username` - Get user by username.

### Recipes
- `GET /recipe` - Get all recipes.
- `GET /recipe/:id` - Get recipe by ID.
- `GET /recipe/user/:id` - Get recipes created by a user.
- `POST /recipe` - Add a recipe (authenticated, `multipart/form-data` with optional image upload).
- `PUT /recipe/:id` - Edit a recipe (optional image upload).
- `DELETE /recipe/:id` - Delete a recipe.

#### 💬 Comments & Ratings
- Each recipe supports **user comments** and **user ratings**.
- Comments are stored per recipe and displayed on the recipe detail page.
- **API endpoints:**
  - `POST /recipe/:id/comment` - Add a comment to a recipe (authenticated).
  - `DELETE /recipe/:id/comment/:commentId` - Delete a comment (authenticated, owner only).
- Ratings are saved per recipe and reflected in the UI as a star rating component.

### Messages
- `POST /message/:id` - Send a message to user ID (authenticated).
- `GET /message/:id` - Get conversation between current user and user ID.
- `GET /message` - Get conversation list (authenticated).

#### 💬 Chat Features
- Users can view a **conversation list** showing all chat partners and the latest message preview.
- Clicking a conversation opens a **chat view** where messages are loaded and sent in real-time (polling).
- Messages are stored per conversation and include sender, text, and timestamp.
- Chat UI highlights unread conversations with a **“new” badge** and visual styling.

---

## 📁 Storage

Uploaded images (profile pics and recipe cover images) are stored in:

- `backend/public/profiles/` (profile pictures)
- `backend/public/images/` (recipe images)

These are served as static assets by the backend.

---

## 🛠️ Troubleshooting

### Backend fails to start / MongoDB connection error
- Verify `CONNECTION_STRING` is correct.
- If using MongoDB Atlas, ensure your IP is whitelisted and the user has permissions.

### Frontend cannot reach backend
- Ensure the backend is running and `VITE_API_BASE_URL` matches the backend URL.

---

## 🎯 Notes

This project is designed as a simple full-stack example and can be extended with:

- proper role-based authorization
- improved error handling and validation
- pagination, search, and filters
- deployment setup (Docker, CI/CD)

---

If you want, I can also add a development script to start both backend and frontend concurrently.
>>>>>>> 9794155 (Add new frontend app and backend updates)
