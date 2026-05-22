// Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');
const recipeDisplay = document.getElementById('recipeDisplay');
const recipeSkeleton = document.getElementById('recipeSkeleton');
const recipeContent = document.getElementById('recipeContent');

let currentSearchQuery = '';
let currentRecipeName = '';

const SYSTEM_PROMPT = `You are a recipe assistant. The user wants to cook a specific dish.
Generate a practical recipe. If it is an Indian dish, use everyday Indian kitchen ingredients. If it is a non-Indian dish, generate the authentic recipe, or suggest a localized Indian version if authentic ingredients are hard to find.
Always return the recipe as a valid JSON object matching the requested schema exactly.`;

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});
retryBtn.addEventListener('click', () => fetchRecipe(currentSearchQuery));

function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  fetchRecipe(query);
}

// Global hook for recommendations to trigger search
window.triggerSearch = (query) => {
  searchInput.value = query;
  fetchRecipe(query);
};

async function fetchRecipe(query) {
  currentSearchQuery = query;
  hideError();
  showSkeleton();

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [{
          role: "user",
          parts: [{ text: `I want to cook: ${query}` }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              overview: {
                type: "OBJECT",
                properties: {
                  prep_time: { type: "STRING" },
                  cook_time: { type: "STRING" },
                  serves: { type: "STRING" },
                  difficulty: { type: "STRING" }
                }
              },
              ingredient_groups: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    group_name: { type: "STRING" },
                    items: { type: "ARRAY", items: { type: "STRING" } }
                  }
                }
              },
              equipment: { type: "ARRAY", items: { type: "STRING" } },
              steps: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    step_number: { type: "INTEGER" },
                    instruction: { type: "STRING" },
                    duration_minutes: { type: "INTEGER" }
                  }
                }
              },
              tips: { type: "ARRAY", items: { type: "STRING" } },
              variations: { type: "ARRAY", items: { type: "STRING" } },
              nutrition: {
                type: "OBJECT",
                properties: {
                  calories: { type: "STRING" },
                  protein: { type: "STRING" },
                  carbs: { type: "STRING" },
                  fat: { type: "STRING" }
                }
              },
              parallel_processes: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    label: { type: "STRING" },
                    steps: { type: "ARRAY", items: { type: "INTEGER" } }
                  }
                }
              }
            },
            required: ["name", "overview", "ingredient_groups", "equipment", "steps", "nutrition", "parallel_processes"]
          }
        }
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    const recipeData = JSON.parse(textResponse);

    renderRecipe(recipeData);

    // Notify Chatbot that a new recipe is loaded
    if (window.notifyChatbotNewRecipe) {
      window.notifyChatbotNewRecipe(recipeData.name);
    }

  } catch (error) {
    console.error("Failed to fetch recipe:", error);
    showError("Failed to fetch recipe. Please try again.");
    hideSkeleton(false);
  }
}

function renderRecipe(data) {
  currentRecipeName = data.name;

  // Title
  document.getElementById('recipeTitle').textContent = data.name;

  // Overview
  const overview = document.getElementById('recipeOverview');
  overview.innerHTML = `
    <div class="overview-card"><span class="label">Prep Time</span><span class="value">${data.overview.prep_time}</span></div>
    <div class="overview-card"><span class="label">Cook Time</span><span class="value">${data.overview.cook_time}</span></div>
    <div class="overview-card"><span class="label">Serves</span><span class="value">${data.overview.serves}</span></div>
    <div class="overview-card"><span class="label">Difficulty</span><span class="value">${data.overview.difficulty}</span></div>
  `;

  // Ingredients
  const ingredientsContainer = document.getElementById('recipeIngredients');
  ingredientsContainer.innerHTML = '';
  let idCounter = 0;
  data.ingredient_groups.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'ingredient-group';
    if (group.group_name) {
      groupDiv.innerHTML += `<h4>${group.group_name}</h4>`;
    }
    group.items.forEach(item => {
      const id = `ing-${idCounter++}`;
      groupDiv.innerHTML += `
        <div class="ingredient-item">
          <input type="checkbox" id="${id}">
          <label for="${id}">${item}</label>
        </div>
      `;
    });
    ingredientsContainer.appendChild(groupDiv);
  });

  // Equipment
  const equipmentContainer = document.getElementById('recipeEquipment');
  equipmentContainer.innerHTML = data.equipment.map(item => `<li>${item}</li>`).join('');

  // Nutrition
  const nutritionContainer = document.getElementById('recipeNutrition');
  nutritionContainer.innerHTML = `
    <span class="nutrition-pill">Calories: ${data.nutrition.calories}</span>
    <span class="nutrition-pill">Protein: ${data.nutrition.protein}</span>
    <span class="nutrition-pill">Carbs: ${data.nutrition.carbs}</span>
    <span class="nutrition-pill">Fat: ${data.nutrition.fat}</span>
  `;

  // Steps (Sequential List)
  const stepsContainer = document.getElementById('recipeSteps');
  stepsContainer.innerHTML = data.steps.map(step => `
    <li>
      ${step.instruction}
      ${step.duration_minutes > 0 ? `<span class="step-time">${step.duration_minutes} min</span>` : ''}
    </li>
  `).join('');

  // Tips & Variations
  const tipsContainer = document.getElementById('recipeTipsVariations');
  let tipsHtml = '';
  if (data.tips && data.tips.length > 0) {
    tipsHtml += `<h4>Tips</h4><ul>${data.tips.map(t => `<li style="margin-bottom:8px; margin-left:20px;">${t}</li>`).join('')}</ul>`;
  }
  if (data.variations && data.variations.length > 0) {
    tipsHtml += `<h4 style="margin-top:15px;">Variations</h4><ul>${data.variations.map(v => `<li style="margin-bottom:8px; margin-left:20px;">${v}</li>`).join('')}</ul>`;
  }
  tipsContainer.innerHTML = tipsHtml || '<p>No specific tips provided.</p>';

  // Render Flow Diagram
  if (window.renderFlowDiagram) {
    window.renderFlowDiagram(data.parallel_processes, data.steps);
  }

  hideSkeleton(true);
}

// UI State Helpers
function showSkeleton() {
  recipeDisplay.classList.remove('hidden');
  recipeSkeleton.classList.remove('hidden');
  recipeContent.classList.add('hidden');
  document.getElementById('recommendationsPanel').classList.add('hidden'); // Hide recommendations when searching
}

function hideSkeleton(success) {
  recipeSkeleton.classList.add('hidden');
  if (success) {
    recipeContent.classList.remove('hidden');
  } else {
    recipeDisplay.classList.add('hidden');
  }
}

function showError(msg) {
  errorState.classList.remove('hidden');
  errorMessage.textContent = msg;
}

function hideError() {
  errorState.classList.add('hidden');
}
