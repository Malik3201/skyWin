// Import configuration
import { OPENWEATHER_API_KEY } from '../../data/config.js';

// Constants
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const COUNTRIES_API_URL = 'https://restcountries.com/v3.1/alpha/';
const DEFAULT_UNITS = 'metric';

// DOM Elements
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loader = document.getElementById('loader');
const locationInfo = document.getElementById('location-info');
const alertsSection = document.getElementById('alerts-section');
const alertsContainer = document.getElementById('alerts-container');
const noAlertsMessage = document.getElementById('no-alerts-message');
const cityName = document.getElementById('city-name');
const countryName = document.getElementById('country-name');
const countryFlag = document.getElementById('country-flag');
const currentYear = document.getElementById('current-year');
const themeToggle = document.getElementById('theme-toggle');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  setupEventListeners();
  
  // Set current year in footer
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }
  
  // Check for saved theme preference
  checkThemePreference();
  
  // Check if user has saved location
  checkSavedLocation();
});

// Function to set up event listeners
function setupEventListeners() {
  // Mobile menu toggle
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Search functionality
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  
  // Enter key for search
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  }
  
  // Location button
  if (locationBtn) {
    locationBtn.addEventListener('click', getUserLocation);
  }
  
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Toggle mobile menu
function toggleMobileMenu() {
  mainNav.classList.toggle('active');
  mobileMenuToggle.classList.toggle('active');
}

// Check and set theme preference
function checkThemePreference() {
  const savedTheme = localStorage.getItem('skycastTheme');
  
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    // Check user's system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('skycastTheme', 'dark');
    }
  }
}

// Toggle theme between light and dark
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('skycastTheme', newTheme);
}

// Handle search
function handleSearch() {
  const query = searchInput ? searchInput.value.trim() : '';
  if (query) {
    showLoading();
    fetchAlertsForCity(query);
  }
}

// Get user's location
function getUserLocation() {
  if (navigator.geolocation) {
    if (locationBtn) {
      locationBtn.textContent = 'Detecting location...';
      locationBtn.disabled = true;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Geolocation success:", position.coords);
        const { latitude, longitude } = position.coords;
        
        // Call the API with coordinates
        fetchAlertsForCoordinates(latitude, longitude);
        
        if (locationBtn) {
          locationBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Use my location
          `;
          locationBtn.disabled = false;
        }
      },
      (error) => {
        console.error('Geolocation error code:', error.code, 'message:', error.message);
        hideLoading();
        
        let errorMsg = 'Unable to retrieve your location.';
        switch(error.code) {
          case 1:
            errorMsg += ' Please allow location access in your browser settings.';
            break;
          case 2:
            errorMsg += ' Position unavailable. Please try again later.';
            break;
          case 3:
            errorMsg += ' Request timed out. Please try again.';
            break;
        }
        
        alert(errorMsg);
        
        if (locationBtn) {
          locationBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Use my location
          `;
          locationBtn.disabled = false;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

// Check if user has saved location
function checkSavedLocation() {
  const savedLocation = localStorage.getItem('weatherAppLocation');
  if (savedLocation) {
    const locationData = JSON.parse(savedLocation);
    
    showLoading();
    
    if (locationData.name) {
      fetchAlertsForCity(locationData.name);
      if (searchInput) searchInput.value = locationData.name;
    } else if (locationData.lat && locationData.lon) {
      fetchAlertsForCoordinates(locationData.lat, locationData.lon);
    }
  }
}

// Show loading state
function showLoading() {
  const loadingSection = document.getElementById('loading-section');
  if (loadingSection) loadingSection.classList.remove('hidden');
  
  if (locationInfo) locationInfo.classList.add('hidden');
  if (alertsSection) alertsSection.classList.add('hidden');
}

// Hide loading state
function hideLoading() {
  const loadingSection = document.getElementById('loading-section');
  if (loadingSection) loadingSection.classList.add('hidden');
  
  if (locationInfo) locationInfo.classList.remove('hidden');
  if (alertsSection) alertsSection.classList.remove('hidden');
}

// Fetch alerts for city
async function fetchAlertsForCity(city) {
  try {
    // First fetch the coordinates for the city
    const weatherResponse = await fetch(
      `${WEATHER_API_BASE_URL}weather?q=${encodeURIComponent(city)}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('City not found');
    }
    
    const weatherData = await weatherResponse.json();
    const { lat, lon } = weatherData.coord;
    
    // Save to local storage
    localStorage.setItem('weatherAppLocation', JSON.stringify({
      name: weatherData.name,
      lat,
      lon,
      country: weatherData.sys.country
    }));
    
    // Update location info
    updateLocationInfo(weatherData.name, weatherData.sys.country);
    
    // Fetch country flag
    fetchCountryFlag(weatherData.sys.country);
    
    // Now fetch alerts with the OneCall API
    await fetchAlertsData(lat, lon);
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    hideLoading();
    alert('Could not find weather data for the specified city. Please check the city name and try again.');
  }
}

// Fetch alerts for coordinates
async function fetchAlertsForCoordinates(lat, lon) {
  try {
    // First get the city name and country
    const weatherResponse = await fetch(
      `${WEATHER_API_BASE_URL}weather?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Location not found');
    }
    
    const weatherData = await weatherResponse.json();
    
    // Save to local storage
    localStorage.setItem('weatherAppLocation', JSON.stringify({
      name: weatherData.name,
      lat,
      lon,
      country: weatherData.sys.country
    }));
    
    // Update location info
    updateLocationInfo(weatherData.name, weatherData.sys.country);
    
    // Fetch country flag
    fetchCountryFlag(weatherData.sys.country);
    
    // Now fetch alerts with the OneCall API
    await fetchAlertsData(lat, lon);
    
  } catch (error) {
    console.error('Error fetching weather data for coordinates:', error);
    hideLoading();
    alert('Could not find weather data for your location. Please try again.');
  }
}

// Fetch alerts data
async function fetchAlertsData(lat, lon) {
  try {
    console.log(`Fetching alerts data for lat: ${lat}, lon: ${lon}`);
    
    // Try OneCall API first (v3.0)
    const oneCallResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&exclude=minutely,hourly,daily&appid=${OPENWEATHER_API_KEY}`
    );
    
    let alertsData = [];
    
    if (!oneCallResponse.ok) {
      console.error('OneCall API error:', await oneCallResponse.text());
      
      // Fallback to v2.5 (though it may not have alerts)
      console.log('Falling back to OneCall v2.5');
      const fallbackResponse = await fetch(
        `${WEATHER_API_BASE_URL}onecall?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&exclude=minutely,hourly,daily&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        alertsData = fallbackData.alerts || [];
      }
    } else {
      const oneCallData = await oneCallResponse.json();
      alertsData = oneCallData.alerts || [];
    }
    
    // Display alerts
    updateAlertsUI(alertsData);
    hideLoading();
    
  } catch (error) {
    console.error('Error fetching alerts data:', error);
    hideLoading();
    
    // Just show empty alerts
    updateAlertsUI([]);
  }
}

// Update location info
function updateLocationInfo(city, country) {
  if (cityName) cityName.textContent = city;
  if (countryName) countryName.textContent = country;
}

// Update alerts UI
function updateAlertsUI(alertsData) {
  if (!alertsContainer) return;
  
  // Clear existing alerts except the no-alerts message
  const nodeList = alertsContainer.childNodes;
  const nodesToRemove = [];
  
  for (let i = 0; i < nodeList.length; i++) {
    const node = nodeList[i];
    if (node !== noAlertsMessage && node.nodeType === Node.ELEMENT_NODE) {
      nodesToRemove.push(node);
    }
  }
  
  nodesToRemove.forEach(node => node.remove());
  
  // Show or hide the no-alerts message
  if (alertsData.length === 0) {
    if (noAlertsMessage) noAlertsMessage.style.display = 'block';
    return;
  } else {
    if (noAlertsMessage) noAlertsMessage.style.display = 'none';
  }
  
  // Sort alerts by severity
  alertsData.sort((a, b) => {
    const severityA = getSeverityLevel(a.event);
    const severityB = getSeverityLevel(b.event);
    return severityA - severityB;
  });
  
  // Create alert elements
  alertsData.forEach(alert => {
    const alertItem = document.createElement('div');
    alertItem.className = `alert-item alert-${getSeverityClass(alert.event)}`;
    
    // Format start and end times
    const start = new Date(alert.start * 1000).toLocaleString();
    const end = new Date(alert.end * 1000).toLocaleString();
    
    alertItem.innerHTML = `
      <div class="alert-header">
        <div class="alert-title">${alert.event}</div>
        <div class="alert-source">Source: ${alert.sender_name || 'Weather Service'}</div>
      </div>
      <div class="alert-time">
        ${start} - ${end}
      </div>
      <div class="alert-description">
        ${alert.description || 'No additional details available.'}
      </div>
    `;
    
    alertsContainer.appendChild(alertItem);
  });
}

// Fetch country flag
async function fetchCountryFlag(countryCode) {
  try {
    if (!countryFlag) return;
    
    // Try to use REST Countries API
    const response = await fetch(`${COUNTRIES_API_URL}${countryCode}`);
    
    if (!response.ok) {
      throw new Error('Country data not found');
    }
    
    const [countryData] = await response.json();
    
    if (countryData && countryData.flags && countryData.flags.png) {
      countryFlag.src = countryData.flags.png;
      countryFlag.alt = `Flag of ${countryData.name.common}`;
      
      // Update country name if available
      if (countryName && countryData.name.common) {
        countryName.textContent = countryData.name.common;
      }
    }
  } catch (error) {
    console.error('Error fetching country flag:', error);
    // Use a fallback flag icon or hide the flag
    countryFlag.style.display = 'none';
  }
}

// Helper function to determine severity class for alerts
function getSeverityClass(eventType) {
  if (!eventType) return 'minor';
  
  eventType = eventType.toLowerCase();
  
  // Extreme events
  if (eventType.includes('extreme') || 
      eventType.includes('tornado') || 
      eventType.includes('hurricane') || 
      eventType.includes('typhoon')) {
    return 'extreme';
  }
  
  // Severe events
  if (eventType.includes('severe') || 
      eventType.includes('warning') || 
      eventType.includes('thunderstorm') || 
      eventType.includes('flood')) {
    return 'severe';
  }
  
  // Moderate events
  if (eventType.includes('moderate') || 
      eventType.includes('watch') || 
      eventType.includes('advisory')) {
    return 'moderate';
  }
  
  // Default to minor
  return 'minor';
}

// Helper function to get numeric severity level (for sorting)
function getSeverityLevel(eventType) {
  if (!eventType) return 4;
  
  eventType = eventType.toLowerCase();
  
  // Extreme events
  if (eventType.includes('extreme') || 
      eventType.includes('tornado') || 
      eventType.includes('hurricane') || 
      eventType.includes('typhoon')) {
    return 1;
  }
  
  // Severe events
  if (eventType.includes('severe') || 
      eventType.includes('warning') || 
      eventType.includes('thunderstorm') || 
      eventType.includes('flood')) {
    return 2;
  }
  
  // Moderate events
  if (eventType.includes('moderate') || 
      eventType.includes('watch') || 
      eventType.includes('advisory')) {
    return 3;
  }
  
  // Minor
  return 4;
} 