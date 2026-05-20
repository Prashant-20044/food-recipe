import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RecipeItems from "../components/RecipeItems";
import Modal from "../components/Modal";
import InputForm from "../components/InputForm";

export default function Home() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const addRecipe = () => {
    let token = localStorage.getItem("token");
    if (token) {
      navigate("/addRecipe");
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero-section">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="hero-video"
        >
          <source
            src="/hero-video.mp4"
            type="video/mp4"
          />
        </video>

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <span className="hero-tag">🔥 Food Blog Platform</span>

          <h1 className="hero-title">
            Cook.<br />
            <span>Share.</span><br />
            Inspire.
          </h1>

          <p className="hero-subtitle">
            Discover delicious recipes, explore food stories, and share
            your culinary creations with food lovers around the world.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={addRecipe}>
              ✨ Share Your Recipe
            </button>

            <button
              className="btn-secondary"
              onClick={() =>
                document
                  .getElementById("recipes")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Recipes ↓
            </button>
          </div>
        </div>
      </section>

      {/* RECIPES SECTION */}
      <section id="recipes" className="recipes-section">
        <div className="section-header">
          <p className="section-tag">Featured Recipes</p>
          <h2 className="section-title">Explore Popular Dishes</h2>
          <p className="section-desc">
            Handpicked recipes shared by passionate food lovers from around the world.
          </p>
        </div>

        <div className="recipe">
          <RecipeItems />
        </div>
      </section>

      {/* LOGIN MODAL */}
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <InputForm setIsOpen={() => setIsOpen(false)} />
        </Modal>
      )}
    </>
  );
}