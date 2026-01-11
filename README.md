# 🍳 Food Recipe Web Application

A full-stack, responsive web platform designed for culinary enthusiasts to discover, share, and manage recipes. This project was developed as part of a **Full-Stack Development Virtual Internship** at **Mainflow Services and Technology Pvt. [cite_start]Ltd**.

---

## 📸 Screenshots

![Landing Page](https://via.placeholder.com/800x400?text=Food+Recipe+Landing+Page)
*Landing page featuring the "Share your recipe" call-to-action.*

![Recipe Dashboard](https://via.placeholder.com/800x400?text=Recipe+Dashboard)
*Recipe dashboard showing various dishes with cook times and "favorite" functionality.*

---

## ✨ Features

* **Recipe Discovery:** Browse a diverse collection of recipes with detailed metadata such as preparation and cook times.
* [cite_start]**User Authentication:** Secure login and sign-up functionality for a personalized user experience[cite: 14].
* **Recipe Management:** Users can add, edit, and delete their own recipes, and save others to a "Favorites" list.
* [cite_start]**Responsive Design:** Optimized for a seamless experience across mobile, tablet, and desktop devices[cite: 14].
* **Search & Filter:** Find recipes easily based on categories or ingredients.

---

## 🛠️ Tech Stack

This project utilizes the **MERN** stack and modern styling tools:

* [cite_start]**Frontend:** React.js, Tailwind CSS [cite: 6, 17]
* [cite_start]**Backend:** Node.js, Express.js [cite: 6]
* **Database:** MongoDB [cite: 6]
* **Authentication:** JWT (JSON Web Tokens)
* **Version Control:** Git & GitHub [cite: 6]

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
