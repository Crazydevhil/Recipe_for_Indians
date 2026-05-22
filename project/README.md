# Indian Recipe Website

A vanilla JavaScript, single-repository recipe website powered by the Gemini API and Unsplash API.

## Features

- **Recipe Search & Display**: Search for Indian recipes using everyday ingredients. Powered by Gemini, the app generates structured recipes including prep time, ingredients, equipment, steps, nutrition, and more.
- **Flow Diagram**: Automatically generates a visual flow diagram (using HTML/CSS flexbox) showing parallel and sequential cooking steps.
- **Recommendations**: Displays 3 random recipe suggestions on page load or when refreshed, complete with real images fetched via the Unsplash API.
- **Recipe Chatbot**: A context-aware chatbot assistant to answer your cooking questions specifically about the recipe you are currently viewing.

## Setup

1. Open `config.js`.
2. Replace `YOUR_GEMINI_API_KEY` with your actual Gemini API key.
3. Replace `YOUR_UNSPLASH_ACCESS_KEY` with your actual Unsplash Access Key.
4. Open `index.html` in your web browser. (Alternatively, run a local static server).

## File Structure

- `index.html`: Main HTML structure.
- `style.css`: Styling using a warm Indian spice color palette.
- `config.js`: Holds API keys.
- `app.js`: Core logic for recipe searching and rendering.
- `recommendations.js`: Logic for fetching random suggestions and images.
- `flowDiagram.js`: Logic for rendering the visual step-by-step cooking diagram.
- `chatbot.js`: Logic for the context-aware recipe assistant.
