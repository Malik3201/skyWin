// Import configuration
import { OPENWEATHER_API_KEY } from '../../data/config.js';

// Weather API endpoints
const CURRENT_WEATHER_ENDPOINT = 'https://api.openweathermap.org/data/2.5/weather';
const ONE_CALL_ENDPOINT = 'https://api.openweathermap.org/data/2.5/onecall';
const FORECAST_ENDPOINT = 'https://api.openweathermap.org/data/2.5/forecast';
const GEOCODING_ENDPOINT = 'https://api.openweathermap.org/geo/1.0/direct';
const REVERSE_GEOCODING_ENDPOINT = 'https://api.openweathermap.org/geo/1.0/reverse';

// REST Countries API endpoint
const COUNTRIES_API_ENDPOINT = 'https://restcountries.com/v3.1';

/**
 * Fetch current weather by city name
 * @param {string} city - Name of the city
 * @returns {Promise} - Returns promise with weather data
 */
async function fetchCurrentWeather(city) {
  try {
    const response = await fetch(`${CURRENT_WEATHER_ENDPOINT}?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Weather data not found');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw error;
  }
}

/**
 * Fetch current weather by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise} - Returns promise with weather data
 */
async function fetchCurrentWeatherByCoords(lat, lon) {
  try {
    const response = await fetch(
      `${CURRENT_WEATHER_ENDPOINT}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Weather data not found');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current weather by coordinates:', error);
    throw error;
  }
}

/**
 * Fetch detailed weather forecast using One Call API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise} - Returns promise with forecast data
 */
async function fetchOneCallForecast(lat, lon) {
  try {
    const response = await fetch(
      `${ONE_CALL_ENDPOINT}?lat=${lat}&lon=${lon}&units=metric&exclude=minutely&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Forecast data not found');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching one call forecast:', error);
    throw error;
  }
}

/**
 * Fetch 5-day 3-hour forecast data
 * @param {string} city - Name of the city
 * @returns {Promise} - Returns promise with forecast data
 */
async function fetch5Day3HourForecast(city) {
  try {
    const response = await fetch(`${FORECAST_ENDPOINT}?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Forecast data not found');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching 5-day forecast:', error);
    throw error;
  }
}

/**
 * Geocode a city name to coordinates
 * @param {string} city - Name of the city
 * @returns {Promise} - Returns promise with location data
 */
async function geocodeCity(city) {
  try {
    const response = await fetch(`${GEOCODING_ENDPOINT}?q=${city}&limit=5&appid=${OPENWEATHER_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error geocoding city:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to city name
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise} - Returns promise with location data
 */
async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(
      `${REVERSE_GEOCODING_ENDPOINT}?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
}

/**
 * Fetch country details by country code
 * @param {string} countryCode - 2-letter country code
 * @returns {Promise} - Returns promise with country data
 */
async function fetchCountryData(countryCode) {
  try {
    const response = await fetch(`${COUNTRIES_API_ENDPOINT}/alpha/${countryCode}`);
    
    if (!response.ok) {
      throw new Error('Country data not found');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching country data:', error);
    throw error;
  }
}

// Export API functions
export {
  fetchCurrentWeather,
  fetchCurrentWeatherByCoords,
  fetchOneCallForecast,
  fetch5Day3HourForecast,
  geocodeCity,
  reverseGeocode,
  fetchCountryData
}; 