const recommendationsList = document.getElementById('recommendationsList');
const refreshBtn = document.getElementById('refreshSuggestionsBtn');

const RECOMMENDATION_PROMPT = `You are a helpful kitchen assistant. Suggest 3 random, delicious Indian recipes that a home cook can make.
Return ONLY a JSON array of objects with this exact structure:
[
  { "name": "Recipe Name", "description": "A short 1-line appetizing description." }
]`;

// Fallback SVG image
const FALLBACK_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232C1810" width="48" height="48"><path d="M20 10V8h-4V4h-2v4h-4V4H8v4H4v2h16zm-8 12c4.41 0 8-3.59 8-8H4c0 4.41 3.59 8 8 8z"/></svg>`;

document.addEventListener('DOMContentLoaded', fetchRecommendations);
refreshBtn.addEventListener('click', fetchRecommendations);

async function fetchRecommendations() {
  showRecommendationSkeletons();

  try {
    // 1. Fetch 3 random recipe names from Gemini
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: RECOMMENDATION_PROMPT }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!geminiRes.ok) throw new Error('Failed to fetch recommendations from Gemini');

    const geminiData = await geminiRes.json();
    const suggestions = JSON.parse(geminiData.candidates[0].content.parts[0].text);

    // 2. Fetch images from Unsplash for each suggestion concurrently
    const suggestionsWithImages = await Promise.all(suggestions.map(async (recipe) => {
      let imageUrl = null;
      try {
        const unsplashRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(recipe.name + ' indian food')}&per_page=1&orientation=landscape`, {
          headers: {
            'Authorization': `Client-ID ${CONFIG.UNSPLASH_ACCESS_KEY}`
          }
        });

        if (unsplashRes.ok) {
          const unsplashData = await unsplashRes.json();
          if (unsplashData.results && unsplashData.results.length > 0) {
            imageUrl = unsplashData.results[0].urls.small;
          }
        }
      } catch (e) {
        console.warn("Unsplash fetch failed for", recipe.name, e);
      }

      return { ...recipe, imageUrl };
    }));

    renderRecommendations(suggestionsWithImages);

  } catch (error) {
    console.error("Recommendation Error:", error);
    recommendationsList.innerHTML = `<p style="color: red; grid-column: 1/-1;">Failed to load suggestions. Please check your API keys or try again.</p>`;
  }
}

function showRecommendationSkeletons() {
  let skeletonsHtml = '';
  for (let i = 0; i < 3; i++) {
    skeletonsHtml += `
      <div class="skeleton-card-wrap">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton-card-content">
          <div class="skeleton skeleton-text-line"></div>
          <div class="skeleton skeleton-text-line short"></div>
        </div>
      </div>
    `;
  }
  recommendationsList.innerHTML = skeletonsHtml;
}

function renderRecommendations(suggestions) {
  recommendationsList.innerHTML = '';

  suggestions.forEach(item => {
    const card = document.createElement('div');
    card.className = 'recipe-card';

    let imageHtml = '';
    if (item.imageUrl) {
      imageHtml = `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy">`;
    } else {
      imageHtml = `<div class="img-placeholder"><img src="${FALLBACK_IMAGE_SVG}" style="width:48px; height:48px; object-fit:contain; background:transparent;"></div>`;
    }

    card.innerHTML = `
      ${imageHtml}
      <div class="recipe-card-content">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      // Calls the global function defined in app.js
      if (window.triggerSearch) {
        window.triggerSearch(item.name);
      }
    });

    recommendationsList.appendChild(card);
  });
}
