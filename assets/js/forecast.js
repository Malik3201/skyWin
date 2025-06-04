// Import configuration and shared functionality
import { OPENWEATHER_API_KEY } from '../../data/config.js';
import { fetchWeatherData, fetchWeatherDataByCoords } from './main.js';

// Constants
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const WEATHER_ICON_URL = 'https://openweathermap.org/img/wn/';
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
const dailyForecastSection = document.getElementById('daily-forecast');
const forecastChartSection = document.getElementById('forecast-chart');
const dailyForecastGrid = document.getElementById('daily-forecast-grid');
const cityName = document.getElementById('city-name');
const countryName = document.getElementById('country-name');
const countryFlag = document.getElementById('country-flag');
const currentYear = document.getElementById('current-year');
const themeToggle = document.getElementById('theme-toggle');

// Chart instance
let temperatureChart = null;

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
  
  // Handle window resize for chart
  window.addEventListener('resize', () => {
    if (temperatureChart) {
      temperatureChart.resize();
    }
  });
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
  
  // Update chart theme if it exists
  if (temperatureChart) {
    updateChartTheme(temperatureChart);
  }
}

// Handle search
function handleSearch() {
  const query = searchInput ? searchInput.value.trim() : '';
  if (query) {
    showLoading();
    fetchExtendedForecast(query);
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
        fetchExtendedForecastByCoords(latitude, longitude);
        
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
      fetchExtendedForecast(locationData.name);
      if (searchInput) searchInput.value = locationData.name;
    } else if (locationData.lat && locationData.lon) {
      fetchExtendedForecastByCoords(locationData.lat, locationData.lon);
    }
  }
}

// Show loading state
function showLoading() {
  if (loader) {
    const loadingSection = document.getElementById('loading-section');
    if (loadingSection) loadingSection.classList.remove('hidden');
  }
  
  if (locationInfo) locationInfo.classList.add('hidden');
  if (dailyForecastSection) dailyForecastSection.classList.add('hidden');
  if (forecastChartSection) forecastChartSection.classList.add('hidden');
}

// Hide loading state
function hideLoading() {
  const loadingSection = document.getElementById('loading-section');
  if (loadingSection) loadingSection.classList.add('hidden');
  
  if (locationInfo) locationInfo.classList.remove('hidden');
  if (dailyForecastSection) dailyForecastSection.classList.remove('hidden');
  if (forecastChartSection) forecastChartSection.classList.remove('hidden');
}

// Fetch extended forecast by city name
async function fetchExtendedForecast(city) {
  try {
    // Fetch current weather to get coordinates
    const currentWeatherResponse = await fetch(
      `${WEATHER_API_BASE_URL}weather?q=${encodeURIComponent(city)}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!currentWeatherResponse.ok) {
      throw new Error('City not found');
    }
    
    const currentWeatherData = await currentWeatherResponse.json();
    const { lat, lon } = currentWeatherData.coord;
    
    // Save to local storage
    localStorage.setItem('weatherAppLocation', JSON.stringify({
      name: currentWeatherData.name,
      lat,
      lon,
      country: currentWeatherData.sys.country
    }));
    
    // Update location info
    updateLocationInfo(currentWeatherData.name, currentWeatherData.sys.country);
    
    // Fetch extended forecast data
    await fetchForecastData(lat, lon);
    
    // Fetch country flag
    fetchCountryFlag(currentWeatherData.sys.country);
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    hideLoading();
    alert('Could not find weather data for the specified city. Please check the city name and try again.');
  }
}

// Fetch extended forecast by coordinates
async function fetchExtendedForecastByCoords(lat, lon) {
  try {
    // Fetch current weather to get city name and country
    const currentWeatherResponse = await fetch(
      `${WEATHER_API_BASE_URL}weather?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!currentWeatherResponse.ok) {
      throw new Error('Weather data not found');
    }
    
    const currentWeatherData = await currentWeatherResponse.json();
    
    // Save to local storage
    localStorage.setItem('weatherAppLocation', JSON.stringify({
      name: currentWeatherData.name,
      lat,
      lon,
      country: currentWeatherData.sys.country
    }));
    
    // Update location info
    updateLocationInfo(currentWeatherData.name, currentWeatherData.sys.country);
    
    // Fetch extended forecast data
    await fetchForecastData(lat, lon);
    
    // Fetch country flag
    fetchCountryFlag(currentWeatherData.sys.country);
    
  } catch (error) {
    console.error('Error fetching weather data by coordinates:', error);
    hideLoading();
    alert('Could not fetch weather data for your location. Please try again.');
  }
}

// Fetch forecast data
async function fetchForecastData(lat, lon) {
  try {
    console.log(`Fetching OneCall data for lat: ${lat}, lon: ${lon}`);
    
    // Try OneCall API first
    const oneCallResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&exclude=minutely,current&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!oneCallResponse.ok) {
      const errorText = await oneCallResponse.text();
      console.error(`OneCall API error: ${errorText}`);
      
      // If OneCall API fails, try with the forecast endpoint as backup
      console.log("Attempting fallback to forecast endpoint");
      await fetchFallbackForecast(lat, lon);
      
      return;
    }
    
    const oneCallData = await oneCallResponse.json();
    console.log("OneCall data:", oneCallData);
    
    // Update daily forecast UI
    if (oneCallData.daily && oneCallData.daily.length > 0) {
      updateDailyForecastUI(oneCallData.daily);
      
      // Create temperature chart
      createTemperatureChart(oneCallData.daily);
    }
    
    hideLoading();
    
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    
    // Try the fallback approach
    try {
      await fetchFallbackForecast(lat, lon);
    } catch (fallbackError) {
      console.error('Fallback forecast fetch also failed:', fallbackError);
      hideLoading();
    }
  }
}

// Fallback to standard forecast endpoint for 5-day forecast
async function fetchFallbackForecast(lat, lon) {
  try {
    console.log("Using fallback forecast endpoint");
    
    // Standard 5-day forecast endpoint
    const forecastResponse = await fetch(
      `${WEATHER_API_BASE_URL}forecast?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!forecastResponse.ok) {
      throw new Error('Forecast data not found');
    }
    
    const forecastData = await forecastResponse.json();
    console.log("Fallback forecast data:", forecastData);
    
    // Extract daily forecast by grouping by day
    const dailyData = processDailyForecast(forecastData.list);
    
    // Update daily forecast UI with extracted data
    updateDailyForecastUI(dailyData);
    
    // Create temperature chart
    createTemperatureChart(dailyData);
    
    hideLoading();
    
  } catch (error) {
    console.error('Error fetching fallback forecast data:', error);
    hideLoading();
  }
}

// Process 3-hour forecast into daily forecast
function processDailyForecast(forecastList) {
  // Group forecasts by day
  const dailyForecasts = {};
  
  forecastList.forEach(forecast => {
    const date = new Date(forecast.dt * 1000);
    const day = date.toISOString().split('T')[0];
    
    if (!dailyForecasts[day]) {
      dailyForecasts[day] = {
        dt: forecast.dt,
        temp: { min: forecast.main.temp, max: forecast.main.temp },
        weather: forecast.weather,
        humidity: forecast.main.humidity,
        pop: forecast.pop || 0
      };
    } else {
      // Update min/max temperatures
      dailyForecasts[day].temp.min = Math.min(dailyForecasts[day].temp.min, forecast.main.temp);
      dailyForecasts[day].temp.max = Math.max(dailyForecasts[day].temp.max, forecast.main.temp);
      
      // Use weather from midday if available (around 12:00)
      const hour = date.getHours();
      if (hour >= 11 && hour <= 14) {
        dailyForecasts[day].weather = forecast.weather;
      }
      
      // Update max pop (probability of precipitation)
      if (forecast.pop) {
        dailyForecasts[day].pop = Math.max(dailyForecasts[day].pop, forecast.pop);
      }
    }
  });
  
  // Convert to array format similar to OneCall daily data
  return Object.values(dailyForecasts);
}

// Update location info
function updateLocationInfo(city, country) {
  if (cityName) cityName.textContent = city;
  if (countryName) countryName.textContent = country;
}

// Update daily forecast UI
function updateDailyForecastUI(dailyData) {
  if (!dailyForecastGrid) {
    console.error("Daily forecast container not found");
    return;
  }
  
  console.log("Updating daily forecast with data:", dailyData);
  
  // Clear existing cards
  dailyForecastGrid.innerHTML = '';
  
  if (!dailyData || dailyData.length === 0) {
    console.warn("No daily forecast data available");
    dailyForecastGrid.innerHTML = '<div class="no-data-message">No daily forecast available</div>';
    return;
  }
  
  // Show all available days
  dailyData.forEach((dayData, index) => {
    try {
      if (!dayData || (!dayData.dt && !dayData.temp)) return; // Skip if essential data missing
      
      const dateTime = new Date(dayData.dt * 1000);
      
      // Handle different data structures
      let highTemp, lowTemp, weatherIcon, pop;
      
      if (dayData.temp.day !== undefined) {
        // OneCall API format
        highTemp = Math.round(dayData.temp.max);
        lowTemp = Math.round(dayData.temp.min);
      } else {
        // Our fallback format
        highTemp = Math.round(dayData.temp.max);
        lowTemp = Math.round(dayData.temp.min);
      }
      
      const weatherInfo = dayData.weather && dayData.weather.length > 0 ? 
        dayData.weather[0] : { icon: '01d', description: 'unknown' };
        
      weatherIcon = weatherInfo.icon || '01d'; // Default icon if missing
      
      // Get precipitation chance
      pop = dayData.pop !== undefined ? Math.round(dayData.pop * 100) : 0;
      
      const dayCard = document.createElement('div');
      dayCard.className = 'daily-card';
      
      // Format day name
      let dayName;
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const isToday = dateTime.setHours(0,0,0,0) === today.setHours(0,0,0,0);
      const isTomorrow = dateTime.setHours(0,0,0,0) === tomorrow.setHours(0,0,0,0);
      
      if (isToday) {
        dayName = 'Today';
      } else if (isTomorrow) {
        dayName = 'Tomorrow';
      } else {
        dayName = dateTime.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      // Extended forecast card with more details
      dayCard.innerHTML = `
        <div class="daily-date">
          <div class="daily-day">${dayName}</div>
          <div class="daily-full-date">${dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
        <div class="daily-weather">
          <img class="daily-icon" src="${WEATHER_ICON_URL}${weatherIcon}.png" alt="${weatherInfo.description}" onerror="this.src='assets/icons/weather-default.png';">
          <div class="daily-description">${weatherInfo.description}</div>
        </div>
        <div class="daily-temps">
          <div class="daily-high">${highTemp}°C</div>
          <div class="daily-low">${lowTemp}°C</div>
        </div>
        <div class="daily-details">
          <div class="daily-detail">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
            <span>${pop}% chance</span>
          </div>
        </div>
      `;
      
      dailyForecastGrid.appendChild(dayCard);
    } catch (error) {
      console.error(`Error rendering daily card at index ${index}:`, error);
    }
  });
}

// Create temperature chart
function createTemperatureChart(dailyData) {
  if (!dailyData || dailyData.length === 0) return;
  
  const chartCanvas = document.getElementById('temperature-chart');
  if (!chartCanvas) return;
  
  // Prepare chart data
  const labels = [];
  const maxTemps = [];
  const minTemps = [];
  
  dailyData.forEach(day => {
    try {
      const date = new Date(day.dt * 1000);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      
      if (day.temp.day !== undefined) {
        // OneCall API format
        maxTemps.push(Math.round(day.temp.max));
        minTemps.push(Math.round(day.temp.min));
      } else {
        // Our fallback format
        maxTemps.push(Math.round(day.temp.max));
        minTemps.push(Math.round(day.temp.min));
      }
    } catch (error) {
      console.error('Error processing chart data:', error);
    }
  });
  
  // Get theme colors
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDarkTheme ? '#e1e1e1' : '#333333';
  
  // Destroy existing chart if it exists
  if (temperatureChart) {
    temperatureChart.destroy();
  }
  
  // Create new chart
  temperatureChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'High',
          data: maxTemps,
          borderColor: '#e67e22',
          backgroundColor: 'rgba(230, 126, 34, 0.2)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Low',
          data: minTemps,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          },
          title: {
            display: true,
            text: 'Temperature (°C)',
            color: textColor
          }
        },
        x: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });
}

// Update chart theme
function updateChartTheme(chart) {
  if (!chart) return;
  
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDarkTheme ? '#e1e1e1' : '#333333';
  
  chart.options.scales.y.grid.color = gridColor;
  chart.options.scales.x.grid.color = gridColor;
  chart.options.scales.y.ticks.color = textColor;
  chart.options.scales.x.ticks.color = textColor;
  chart.options.scales.y.title.color = textColor;
  chart.options.plugins.legend.labels.color = textColor;
  
  chart.update();
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