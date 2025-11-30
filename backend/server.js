require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow frontend to call this API
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "What Do I Cook API is running" });
});

// Route: Search recipes by ingredients
app.get("/api/recipes/search", async (req, res) => {
  try {
    const { ingredients } = req.query;

    if (!ingredients) {
      return res.status(400).json({ error: "Ingredients parameter is required" });
    }

    const apiKey = process.env.SPOONACULAR_API_KEY;
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(
      ingredients
    )}&number=9&ranking=1&ignorePantry=true&apiKey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// Route: Get full recipe details by ID
app.get("/api/recipes/:id/details", async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = process.env.SPOONACULAR_API_KEY;

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Spoonacular API key not configured on server" });
    }

    const url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=false&apiKey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Spoonacular details API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    res.status(500).json({ error: "Failed to fetch recipe details" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});