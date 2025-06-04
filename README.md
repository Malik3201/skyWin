# Weather App

A modern, multi-page weather application built with HTML, CSS, and JavaScript.

## Features

- Current weather and local time display
- Hourly weather forecast (12-24 hours)
- 14-day weather forecast
- Country flag display for each searched city
- Interactive map of the searched city
- Search by city name functionality
- Auto-detect user location
- Weather alerts (storms, floods, etc.)
- Smart chatbot assistant powered by Gemini API
- Modern, animated light-theme UI
- Fully responsive design
- Multi-page structure

## Technologies

- HTML5
- CSS3 (Custom CSS, no frameworks)
- JavaScript (Vanilla JS)
- OpenWeatherMap API
- REST Countries API
- Leaflet.js + OpenStreetMap
- HTML5 Geolocation API
- Gemini AI API

## Project Structure

```
weather-app/
├── index.html             # Home page
├── pages/                 # Additional pages
│   ├── forecast.html      # 14-day forecast page
│   ├── map.html           # Interactive map page
│   ├── chat.html          # Chat assistant page
│   └── alerts.html        # Weather alerts page
├── css/
│   └── style.css          # All styles including responsive design
├── js/
│   ├── app.js             # Main application logic
│   ├── forecast.js        # Forecast page functionality (to be implemented)
│   ├── map.js             # Map page functionality (to be implemented)
│   ├── chat.js            # Chat assistant functionality (to be implemented)
│   └── alerts.js          # Alerts page functionality (to be implemented)
└── assets/                # Images and icons
    ├── icons/
    └── images/
```

## Getting Started

To run this project locally, simply:

1. Clone the repository
2. Open `index.html` in your web browser
3. No build process or dependencies required

## API Keys

The project uses the following API keys:

1. OpenWeatherMap API:
   - Base URL: `https://api.openweathermap.org/data/2.5/`
   - API Key: `c33e918423e97432058e232d7a0b977b`

2. Gemini Chatbot API:
   - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
   - API Key: `AIzaSyB4_e6cQcaiLiySNcSEG2C-1ukd-aYTABg`

## Next Steps

The basic structure of the application has been set up. The next steps are:

1. Implement the weather data fetching from OpenWeatherMap API
2. Set up country flag display using REST Countries API
3. Implement the interactive map using Leaflet.js
4. Set up the chatbot functionality using Gemini API
5. Implement weather alerts system
6. Create additional animations and UI enhancements 