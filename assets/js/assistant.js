// Import configuration
import { OPENWEATHER_API_KEY, GEMINI_API_KEY } from '../../data/config.js';

// Constants
const API_KEY = "AIzaSyBQNn96Eq0nE2wYtU9iXgc7uJXuA615Qss"; // Direct API key as backup
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const DEFAULT_UNITS = 'metric';

// Log API key length to check if it's loaded (don't log full key for security)
console.log("API Key length:", API_KEY.length);
console.log("Using Gemini API 1.5 Flash model");

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const suggestionChips = document.querySelectorAll('.suggestion-chip');
const currentYear = document.getElementById('current-year');
const themeToggle = document.getElementById('theme-toggle');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');

// Current weather and location data
let currentWeatherData = null;
let currentLocation = {
  city: null,
  country: null
};

// Chat variables
let controller;
let typingInterval;
const chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Content Loaded - Initializing SkyBot Assistant");
  
  // Debug DOM elements
  console.log("Chat messages element:", chatMessages ? "Found" : "Not found");
  console.log("Chat input element:", chatInput ? "Found" : "Not found");
  console.log("Chat send button:", chatSend ? "Found" : "Not found");
  
  // Add global click listener to debug event handling
  document.addEventListener('click', function(e) {
    console.log('Click detected on:', e.target.tagName, 
                e.target.id ? `#${e.target.id}` : '', 
                e.target.className ? `.${e.target.className.replace(' ', '.')}` : '');
                
    // Check if the click was on or inside the chat send button
    if (chatSend && (e.target === chatSend || chatSend.contains(e.target))) {
      console.log("Click detected on chat send button or its child!");
    }
  });
  
  // Set up event listeners
  setupEventListeners();
  
  // Set current year in footer
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }
  
  // Check for saved theme preference
  checkThemePreference();
  
  // Check for saved location
  checkSavedLocation();
  
  // Check for query parameter
  checkQueryParameter();
  
  // Add welcome message with theme-aware customization
  setTimeout(() => {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const greeting = isDarkTheme ? 
      "👋 Hello! I'm SkyBot, your weather assistant. I notice you're using dark mode - easy on the eyes! Ask me anything about weather conditions, forecasts, or climate information." :
      "👋 Hello! I'm SkyBot, your weather assistant. Ask me anything about weather conditions, forecasts, or climate information!";
    
    // Replace the default greeting with our dynamic one
    if (chatMessages && chatMessages.firstElementChild) {
      chatMessages.firstElementChild.querySelector('.chat-message-content').textContent = greeting;
    }
  }, 500);
});

// Set up event listeners
function setupEventListeners() {
  console.log("Setting up event listeners");
  
  // Chat send button
  if (chatSend) {
    console.log("Adding click event to chat send button");
    chatSend.addEventListener('click', function(event) {
      console.log("Chat send button clicked");
      handleChatSend();
    });
  } else {
    console.error("Chat send button element not found!");
  }
  
  // Enter key for chat
  if (chatInput) {
    console.log("Adding keypress event to chat input");
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log("Enter key pressed in chat input");
        handleChatSend();
      }
    });
    
    // Add focus animation
    chatInput.addEventListener('focus', () => {
      document.querySelector('.chat-input-container')?.classList.add('focused');
    });
    
    chatInput.addEventListener('blur', () => {
      document.querySelector('.chat-input-container')?.classList.remove('focused');
    });
  } else {
    console.error("Chat input element not found!");
  }
  
  // Suggestion chips
  if (suggestionChips.length > 0) {
    console.log(`Adding click events to ${suggestionChips.length} suggestion chips`);
    suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query') || chip.textContent;
        console.log("Suggestion chip clicked:", query);
        if (chatInput) chatInput.value = query;
        handleChatSend();
      });
    });
  } else {
    console.warn("No suggestion chips found");
  }
  
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Mobile menu toggle
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Close mobile menu with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav && mainNav.classList.contains('active')) {
      toggleMobileMenu();
    }
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (mainNav && mainNav.classList.contains('active') &&
        !mainNav.contains(e.target) && 
        !mobileMenuToggle.contains(e.target)) {
      toggleMobileMenu();
    }
  });
}

// Handle chat send
function handleChatSend() {
  console.log("Handle chat send called");
  
  if (!chatInput) {
    console.error("Chat input element not available");
    return;
  }
  
  const userMessage = chatInput.value.trim();
  console.log("User message:", userMessage);
  
  if (!userMessage) {
    console.warn("Empty message, not sending");
    return;
  }
  
  // Add user message to chat
  addChatMessage(userMessage, 'user');
  
  // Clear input
  chatInput.value = '';
  
  // Show loading indicator
  showChatLoading();
  
  // Process message and get response
  processChatMessage(userMessage);
}

// Process chat message
async function processChatMessage(message) {
  try {
    console.log("Processing chat message:", message);
    
    // Check if the message is asking about weather for a specific location
    const locationMatch = message.match(/weather\s+(?:in|for|at)\s+([a-zA-Z\s,]+)/i) || 
                         message.match(/(?:how's|how is|what's|what is)\s+(?:the\s+)?weather\s+(?:in|at|for)\s+([a-zA-Z\s,]+)/i);
    
    const locationName = locationMatch ? locationMatch[1].trim() : null;
    let weatherData = null;
    
    // If asking about a specific location different from current, try to fetch it
    if (locationName && (!currentLocation.city || 
        !locationName.toLowerCase().includes(currentLocation.city.toLowerCase()))) {
      console.log(`User is asking about weather in ${locationName}, fetching data...`);
      try {
        // Show loading indicator during this extra fetch
        showChatLoading();
        weatherData = await fetchWeatherForLocation(locationName);
      } catch (weatherError) {
        console.error(`Failed to fetch weather for ${locationName}:`, weatherError);
      }
    }
    
    // Prepare weather context from either the newly fetched data or current data
    let weatherContext = "";
    
    if (weatherData) {
      // Use newly fetched weather data
      const location = `${weatherData.name}, ${weatherData.sys.country}`;
      const conditions = weatherData.weather[0].description;
      const temp = Math.round(weatherData.main.temp);
      const humidity = weatherData.main.humidity;
      const windSpeed = weatherData.wind.speed;
      
      weatherContext = `Current weather in ${location}: ${conditions}, ${temp}°C, humidity ${humidity}%, wind ${windSpeed} m/s.`;
    } else if (currentLocation.city && currentWeatherData) {
      // Use current weather data
      weatherContext = `Current weather in ${currentLocation.city}, ${currentLocation.country}: ${currentWeatherData.weather[0].description}, ${Math.round(currentWeatherData.main.temp)}°C, humidity ${currentWeatherData.main.humidity}%, wind ${currentWeatherData.wind.speed} m/s.`;
    }
    
    // Remove loading indicator to prepare for typing effect
    removeChatLoading();
    
    // Create a new message div for the bot response with typing effect
    const botMessageDiv = createBotMessageDiv();
    
    try {
      // Add context as first message if this is the first interaction
      if (chatHistory.length === 0) {
        // Add an initial "model" message with instructions
        chatHistory.push({
          role: "model",
          parts: [{ 
            text: `I'm SkyBot, your friendly weather assistant. I can help you with weather-related questions.`
          }]
        });
      }
      
      // Enhance user message with weather data context
      let enhancedMessage = message;
      if (weatherContext) {
        // Add actual weather data to the prompt
        enhancedMessage = `${message}\n\nI have the following real-time weather information to use in my response: ${weatherContext}\n\nPlease use this actual data in your response without disclaimers about not having access to real-time data.`;
      } else {
        enhancedMessage = `${message}\n\nPlease note that I don't have specific weather data for this query. If the user is asking about current weather conditions for a specific location, suggest checking a weather website or app.`;
      }
      
      // Add user message to chat history
      chatHistory.push({
        role: "user",
        parts: [{ text: enhancedMessage }]
      });
      
      console.log("Chat history updated, entries:", chatHistory.length);
      
      // Try standard API call first
      await generateResponse(botMessageDiv);
    } catch (apiError) {
      console.error("First API attempt failed:", apiError);
      
      // If standard API call fails, try simplified approach
      console.log("Trying simplified API fallback approach");
      const prompt = `User: ${message}\n\nI am SkyBot, a weather assistant. ${weatherContext ? 'I have access to the following weather information: ' + weatherContext : 'I don\'t have specific weather data for this query.'}
      
      Important: If I have weather data provided above, use it in my response instead of saying I don't have access to real-time weather data.`;
      
      const response = await callSimplifiedGeminiAPI(prompt);
      
      // Use typing effect for the response
      const textElement = botMessageDiv.querySelector('.chat-message-content');
      typingEffect(response, textElement, botMessageDiv);
    }
    
  } catch (error) {
    console.error('Error processing chat message:', error);
    
    // Remove loading indicator
    removeChatLoading();
    
    // Add error message
    addChatMessage('Sorry, I encountered an error. Please try again later.', 'bot');
  }
}

// Fetch weather data for a specific location
async function fetchWeatherForLocation(location) {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE_URL}weather?q=${encodeURIComponent(location)}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather data not found for ${location}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching weather for ${location}:`, error);
    throw error;
  }
}

// Generate response with Gemini API
async function generateResponse(botMsgDiv) {
  const textElement = botMsgDiv.querySelector('.chat-message-content');
  controller = new AbortController();
  
  try {
    console.log("Calling AI API...");
    
    // Prepare the request body with simplified format - no system role
    const requestBody = {
      contents: chatHistory
    };
    
    console.log("Request body:", JSON.stringify(requestBody).substring(0, 200) + "...");
    
    // Send the chat history to the API to get a response
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    console.log("Response status:", response.status);
    
    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Status:', response.status);
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Response received");
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      
      // Get response text and remove any disclaimers about not having access to real-time data
      let responseText = data.candidates[0].content.parts[0].text.trim();
      
      // Check for and remove common disclaimers
      const disclaimers = [
        "I don't have access to real-time weather data",
        "I do not have real-time access to",
        "I don't have the ability to check",
        "I don't have current weather information",
        "I cannot provide real-time weather updates",
        "I don't have access to live weather data",
        "Powered by Google Gemini",
        "Powered by Gemini"
      ];
      
      // Remove paragraphs containing disclaimers
      const paragraphs = responseText.split('\n\n');
      const filteredParagraphs = paragraphs.filter(paragraph => {
        return !disclaimers.some(disclaimer => paragraph.toLowerCase().includes(disclaimer.toLowerCase()));
      });
      
      responseText = filteredParagraphs.join('\n\n');
      
      console.log("Response text:", responseText.substring(0, 50) + "...");
      
      // Use typing effect for the response
      typingEffect(responseText, textElement, botMsgDiv);
      
      // Add to chat history - but without the disclaimers
      chatHistory.push({
        role: "model",
        parts: [{ text: responseText }]
      });
    } else {
      console.error("Invalid or empty response structure:", data);
      textElement.textContent = "I couldn't generate a proper response. Please try again.";
      botMsgDiv.classList.remove("loading");
    }
  } catch (error) {
    console.error('Error calling API:', error);
    let errorMessage = error.name === "AbortError" ? 
      "Response generation stopped." : 
      `Error: ${error.message || "There was a problem connecting to the AI service. Please try again later."}`;
      
    textElement.textContent = errorMessage;
    botMsgDiv.classList.remove("loading");
  }
}

// Fallback for simplified API call - avoids any system role
async function callSimplifiedGeminiAPI(prompt) {
  try {
    console.log("Using simplified API call with prompt:", prompt.substring(0, 50) + "...");
    
    // Create a minimal conversation with just the prompt
    const simpleContents = [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ];
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: simpleContents
      })
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error("API Error response:", errorText);
      return "Sorry, there was an error connecting to the AI service.";
    }

    const data = await response.json();
    console.log("Simplified API call successful");
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
        
      // Get response text and clean it
      let responseText = data.candidates[0].content.parts[0].text;
      
      // Check for and remove common disclaimers
      const disclaimers = [
        "I don't have access to real-time weather data",
        "I do not have real-time access to",
        "I don't have the ability to check",
        "I don't have current weather information",
        "I cannot provide real-time weather updates",
        "I don't have access to live weather data",
        "Powered by Google Gemini",
        "Powered by Gemini"
      ];
      
      // Remove paragraphs containing disclaimers
      const paragraphs = responseText.split('\n\n');
      const filteredParagraphs = paragraphs.filter(paragraph => {
        return !disclaimers.some(disclaimer => paragraph.toLowerCase().includes(disclaimer.toLowerCase()));
      });
      
      responseText = filteredParagraphs.join('\n\n');
      
      return responseText;
    } else {
      return "I couldn't generate a response. Please try again.";
    }
  } catch (error) {
    console.error("API Call Error:", error);
    return "There was a problem connecting to the AI service.";
  }
}

// Create a bot message div for typing effect
function createBotMessageDiv() {
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message bot loading';
  
  const messageContent = document.createElement('div');
  messageContent.className = 'chat-message-content';
  
  messageElement.appendChild(messageContent);
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  scrollChatToBottom();
  
  return messageElement;
}

// Simulate typing effect for bot responses
function typingEffect(text, textElement, botMsgDiv) {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;
  
  // Set an interval to type each word
  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      scrollChatToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
    }
  }, 40); // 40 ms delay
}

// Add message to chat
function addChatMessage(message, type) {
  if (!chatMessages) return;
  
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `chat-message ${type}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'chat-message-content';
  messageContent.textContent = message;
  
  messageElement.appendChild(messageContent);
  chatMessages.appendChild(messageElement);
  
  // Scroll to bottom
  scrollChatToBottom();
}

// Show chat loading indicator
function showChatLoading() {
  if (!chatMessages) return;
  
  const loadingElement = document.createElement('div');
  loadingElement.className = 'chat-loading';
  loadingElement.id = 'chat-loading';
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'chat-loading-dot';
    loadingElement.appendChild(dot);
  }
  
  chatMessages.appendChild(loadingElement);
  
  // Scroll to bottom
  scrollChatToBottom();
}

// Remove chat loading indicator
function removeChatLoading() {
  const loadingElement = document.getElementById('chat-loading');
  if (loadingElement) {
    loadingElement.remove();
  }
}

// Scroll chat to bottom
function scrollChatToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Check for saved location
function checkSavedLocation() {
  const savedLocation = localStorage.getItem('weatherAppLocation');
  
  if (savedLocation) {
    const locationData = JSON.parse(savedLocation);
    if (locationData.name) {
      currentLocation.city = locationData.name;
    }
    if (locationData.country) {
      currentLocation.country = locationData.country;
    }
    
    // Fetch current weather for this location
    if (locationData.lat && locationData.lon) {
      fetchCurrentWeather(locationData.lat, locationData.lon);
    }
  }
}

// Fetch current weather for chatbot context
async function fetchCurrentWeather(lat, lon) {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE_URL}weather?lat=${lat}&lon=${lon}&units=${DEFAULT_UNITS}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      currentWeatherData = data;
      console.log("Current weather data for chatbot:", data);
    }
  } catch (error) {
    console.error('Error fetching current weather for chatbot:', error);
  }
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

// Toggle theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('skycastTheme', newTheme);
  
  // Update welcome message to be theme-aware
  const isDarkTheme = newTheme === 'dark';
  
  // If no messages have been exchanged yet, update welcome message
  const messageCount = chatMessages ? chatMessages.children.length : 0;
  if (messageCount <= 1) {
    const greeting = isDarkTheme ? 
      "👋 Hello! I'm SkyBot, your weather assistant. I notice you're using dark mode - easy on the eyes! Ask me anything about weather conditions, forecasts, or climate information." :
      "👋 Hello! I'm SkyBot, your weather assistant. Ask me anything about weather conditions, forecasts, or climate information!";
    
    // Update the first message if it exists
    if (chatMessages && chatMessages.firstElementChild) {
      chatMessages.firstElementChild.querySelector('.chat-message-content').textContent = greeting;
    }
  }
}

// Check for query parameter
function checkQueryParameter() {
  // First check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('query');
  
  // Then check localStorage for any pending query
  const pendingQuery = localStorage.getItem('skycastPendingQuery');
  
  // Clear localStorage item regardless to avoid double-processing
  if (pendingQuery) {
    localStorage.removeItem('skycastPendingQuery');
  }
  
  // Process either the URL query or the pending query
  const messageToProcess = query || pendingQuery;
  
  if (messageToProcess && chatInput) {
    console.log("Query found:", messageToProcess);
    chatInput.value = messageToProcess;
    // Use setTimeout to ensure the DOM is fully loaded
    setTimeout(() => handleChatSend(), 500);
  }
}

// Toggle mobile menu
function toggleMobileMenu() {
  mainNav.classList.toggle('active');
  mobileMenuToggle.classList.toggle('active');
  
  // Toggle body scroll lock
  if (mainNav.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
} 