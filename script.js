// Select DOM elements
const searchForm = document.getElementById("search-form");
const ingredientsInput = document.getElementById("ingredients-input");
const loadingSection = document.getElementById("loading-section");
const errorSection = document.getElementById("error-section");
const errorMessage = document.getElementById("error-message");
const resultsTitle = document.getElementById("results-title");
const resultsGrid = document.getElementById("results-grid");
const favoritesSection = document.getElementById("favorites-section");
const favoritesGrid = document.getElementById("favorites-grid");
const favoritesEmptyMessage = document.getElementById("favorites-empty-message");
const recipeDetailsModalEl = document.getElementById("recipeDetailsModal");
const recipeDetailsLoading = document.getElementById("recipe-details-loading");
const recipeDetailsContent = document.getElementById("recipe-details-content");
const recipeDetailsError = document.getElementById("recipe-details-error");
const detailsImage = document.getElementById("details-image");
const detailsTitle = document.getElementById("details-title");
const detailsIngredients = document.getElementById("details-ingredients");
const detailsInstructions = document.getElementById("details-instructions");
const detailsSource = document.getElementById("details-source");
const toggleFavoritesBtn = document.getElementById("toggle-favorites-btn");

// === CONFIG: Your own backend API ===
const API_BASE_URL = "http://localhost:3000/api";

// Helper functions for UI state
function showLoading() {
  loadingSection.classList.remove("d-none");
}

function hideLoading() {
  loadingSection.classList.add("d-none");
}

function showError(message) {
  errorMessage.textContent = message;
  errorSection.classList.remove("d-none");
}

function clearError() {
  errorSection.classList.add("d-none");
  errorMessage.textContent = "";
}

function clearResults() {
  resultsGrid.innerHTML = "";
  resultsTitle.classList.add("d-none");
}

// === Favorites using localStorage ===
const FAVORITES_KEY = "wdic_favorites"; // What Do I Cook favorites

function loadFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse favorites from localStorage", e);
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(id) {
  const favorites = loadFavorites();
  return favorites.some((fav) => fav.id === id);
}

function renderFavorites() {
  const favorites = loadFavorites();
  favoritesGrid.innerHTML = "";

  if (!favorites || favorites.length === 0) {
    favoritesEmptyMessage.classList.remove("d-none");
    return;
  }

  favoritesEmptyMessage.classList.add("d-none");
    
  favorites.forEach((recipe) => {
    const card = createRecipeCard(recipe);
    favoritesGrid.appendChild(card);
  });
}

// Toggle favorites section visibility
toggleFavoritesBtn.addEventListener("click", () => {
  const isVisible = favoritesSection.classList.contains("is-visible");

  if (isVisible) {
    favoritesSection.classList.remove("is-visible");
    toggleFavoritesBtn.textContent = "Show favorites";
  } else {
    favoritesSection.classList.add("is-visible");
    toggleFavoritesBtn.textContent = "Hide favorites";
  }
});

// Optional: if there are already favorites, show section when page loads
// if (loadFavorites().length > 0) {
//   favoritesSection.classList.add("is-visible");
//   toggleFavoritesBtn.textContent = "Hide favorites";
// }

// Render one recipe card (reusable JS "component")
function createRecipeCard(recipe) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4";

  const favorites = loadFavorites();
  const alreadyFavorite = favorites.some((fav) => fav.id === recipe.id);

  const buttonLabel = alreadyFavorite ? "Saved" : "Save to favorites";
  const buttonClass = alreadyFavorite ? "btn-success is-favorite" : "btn-outline-primary";

  col.innerHTML = `
    <div class="card h-100" data-recipe-id="${recipe.id}">
      <img src="${recipe.image}" class="card-img-top recipe-image" alt="${recipe.title}">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${recipe.title}</h5>
        <p class="card-text mb-2">
          <strong>Ingredients:</strong> ${recipe.ingredients.join(", ")}
        </p>
        <p class="card-text small text-muted flex-grow-1">
          ${recipe.instructions}
        </p>
        <button class="btn ${buttonClass} mt-2 btn-save-favorite" data-id="${recipe.id}">
          ${buttonLabel}
        </button>
      </div>
    </div>
  `;

  return col;
}

// Render a list of recipes
function renderRecipes(recipes) {
  clearResults();

  if (!recipes || recipes.length === 0) {
    showError("No recipes found. Try different ingredients.");
    return;
  }

  resultsTitle.classList.remove("d-none");

  recipes.forEach((recipe) => {
    const card = createRecipeCard(recipe);
    resultsGrid.appendChild(card);
  });
}

// Call Spoonacular API to find recipes by ingredients
async function fetchRecipesByIngredients(ingredients) {
  const params = new URLSearchParams({ ingredients });

  const url = `${API_BASE_URL}/recipes/search?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data; // array of recipes
}

// Fetch full recipe details from our backend
async function fetchRecipeDetails(id) {
  const url = `${API_BASE_URL}/recipes/${id}/details`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Details API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

function resetDetailsModalState() {
  recipeDetailsLoading.classList.add("d-none");
  recipeDetailsContent.classList.add("d-none");
  recipeDetailsError.classList.add("d-none");
}

function renderRecipeDetails(data) {
  // Title & image
  detailsTitle.textContent = data.title || "Recipe details";
  detailsImage.src = data.image || "https://placehold.co/800x400?text=No+Image";
  detailsImage.alt = data.title || "Recipe image";

  // Ingredients
  detailsIngredients.innerHTML = "";
  if (Array.isArray(data.extendedIngredients)) {
    data.extendedIngredients.forEach((ing) => {
      const li = document.createElement("li");
      li.textContent = ing.original || ing.name || "";
      detailsIngredients.appendChild(li);
    });
  }

  // Instructions or summary
  if (data.instructions) {
    detailsInstructions.innerHTML = data.instructions;
  } else if (data.summary) {
    detailsInstructions.innerHTML = data.summary;
  } else {
    detailsInstructions.textContent =
      "No detailed instructions available for this recipe.";
  }

  // Source (site / link)
  if (data.sourceName || data.sourceUrl) {
    const srcName = data.sourceName || "Source";
    const srcUrl = data.sourceUrl || "#";
    detailsSource.innerHTML = `Recipe from <a href="${srcUrl}" target="_blank" rel="noopener">${srcName}</a>`;
  } else {
    detailsSource.textContent = "";
  }
}

// Transform Spoonacular recipe into our internal shape
function mapSpoonacularRecipe(recipe) {
  const allIngredients = [
    ...(recipe.usedIngredients || []),
    ...(recipe.missedIngredients || [])
  ];

  const ingredientNames = allIngredients.map((ing) => ing.name);

  return {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image || "https://placehold.co/600x400?text=No+Image",
    ingredients: ingredientNames,
    instructions:
      "Click for more details (instructions not loaded yet in this basic version)."
  };
}

// Handle clicks on "Save to favorites" buttons
document.addEventListener("click", (event) => {
  const button = event.target.closest(".btn-save-favorite");
  if (!button) return;

  const card = button.closest(".card");
  if (!card) return;

  const id = parseInt(button.dataset.id, 10);

  let favorites = loadFavorites();
  const alreadyFavorite = favorites.some((fav) => fav.id === id);

  if (alreadyFavorite) {
    // Remove from favorites
    favorites = favorites.filter((fav) => fav.id !== id);
    saveFavorites(favorites);
    renderFavorites();

    // Update button appearance + label on this card
    button.classList.remove("btn-success", "is-favorite");
    button.classList.add("btn-outline-primary");
    button.textContent = "Save to favorites";
    return;
  }

  // Add to favorites (same logic as before)
  const titleEl = card.querySelector(".card-title");
  const imgEl = card.querySelector("img.card-img-top");
  const textEls = card.querySelectorAll(".card-text");
  
  const title = titleEl ? titleEl.textContent.trim() : "Unknown recipe";
  const image = imgEl ? imgEl.src : "https://placehold.co/600x400?text=No+Image";

  // Our ingredients are inside the first .card-text, after "Ingredients:"
  let ingredientsText = "";
  if (textEls[0]) {
    // e.g. "Ingredients: pasta, tomato, onion"
    ingredientsText = textEls[0].textContent.replace("Ingredients:", "").trim();
  }
  const ingredients = ingredientsText
    ? ingredientsText.split(",").map((s) => s.trim())
    : [];

  const recipe = {
    id,
    title,
    image,
    ingredients,
    instructions:
      textEls[1]?.textContent.trim() ||
      "Click for more details (instructions not loaded yet in this basic version)."
  };

  favorites.push(recipe);
  saveFavorites(favorites);
  renderFavorites();

  // Update button appearance + label on this card
  button.classList.remove("btn-outline-primary");
  button.classList.add("btn-success", "is-favorite");
  button.textContent = "Saved";
});

// Handle clicks on recipe cards to show details (ignore favorite button clicks)
document.addEventListener("click", async (event) => {
  // If user clicked the favorites button, let the other handler deal with it
  if (event.target.closest(".btn-save-favorite")) {
    return;
  }

  const card = event.target.closest(".card");
  if (!card) return;

  const idAttr = card.getAttribute("data-recipe-id");
  if (!idAttr) return;

  const id = parseInt(idAttr, 10);
  if (!id) return;

  // Prepare modal
  resetDetailsModalState();
  recipeDetailsLoading.classList.remove("d-none");

  const bsModal = new bootstrap.Modal(recipeDetailsModalEl);
  bsModal.show();

  try {
    const details = await fetchRecipeDetails(id);
    resetDetailsModalState();
    renderRecipeDetails(details);
    recipeDetailsContent.classList.remove("d-none");
  } catch (error) {
    console.error(error);
    resetDetailsModalState();
    recipeDetailsError.classList.remove("d-none");
  }
});

// Handle form submit with real API
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  clearResults();

  const ingredients = ingredientsInput.value.trim();

  if (!ingredients) {
    showError("Please enter at least one ingredient.");
    return;
  }

  showLoading();

  try {
    // 1) Ask our backend for recipes
    const apiRecipes = await fetchRecipesByIngredients(ingredients);

    if (!apiRecipes || apiRecipes.length === 0) {
      hideLoading();
      showError("No recipes found. Try different ingredients.");
      return;
    }

    // 2) Map them into the structure expected by renderRecipes
    const recipes = apiRecipes.map(mapSpoonacularRecipe);

    hideLoading();
    renderRecipes(recipes);
  } catch (error) {
    console.error(error);
    hideLoading();
    showError(
      "Something went wrong while fetching recipes. Please try again later."
    );
  }
});

// Initialize favorites section when the page loads
renderFavorites();