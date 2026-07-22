let weatherContext = ""; // Memory for the AI

async function getWeather() {
    const city = document.getElementById('city').value;
    const errorMsg = document.getElementById('error-message');
    const loading = document.getElementById('loading');
    const weatherContainer = document.querySelector('.weather-container');

    if (!city) {
        showError('Please enter a city name');
        return;
    }

    const apiKey = 'da5cc509bc967933cf9f957a7a06eb9b';
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    loading.style.display = 'block';
    weatherContainer.style.display = 'none';
    errorMsg.style.display = 'none';

    try {
        const currentResponse = await fetch(currentWeatherUrl);
        if (!currentResponse.ok) throw new Error('City not found');
        const currentData = await currentResponse.json();

        // Update UI
        document.getElementById('cityName').textContent = currentData.name;
        document.getElementById('temperature').textContent = `${Math.round(currentData.main.temp)}°C`;
        document.getElementById('description').textContent = currentData.weather[0].description;
        document.getElementById('humidity').textContent = `Humidity: ${currentData.main.humidity}%`;
        document.getElementById('wind').textContent = `Wind: ${currentData.wind.speed} m/s`;
        document.getElementById('feels-like').textContent = `Feels like: ${Math.round(currentData.main.feels_like)}°C`;

        const iconCode = currentData.weather[0].icon;
        document.querySelector('.current-weather .icon').innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png">`;

        // Save Context for AI
        weatherContext = `In ${currentData.name}, it's ${currentData.main.temp}°C and ${currentData.weather[0].description}. Humidity is ${currentData.main.humidity}%.`;

        changeBackground(currentData.weather[0].main.toLowerCase());

        // Forecast Logic
        const forecastResponse = await fetch(forecastWeatherUrl);
        const forecastData = await forecastResponse.json();
        const forecastDays = document.querySelectorAll('.day');
        const uniqueDays = [];
        forecastData.list.forEach((item) => {
            const date = new Date(item.dt_txt);
            const day = date.getDate();
            if (!uniqueDays.includes(day) && uniqueDays.length < 4) uniqueDays.push(day);
        });
        forecastDays.forEach((day, index) => {
            if (uniqueDays[index] !== undefined) {
                const forecast = forecastData.list.find((item) => new Date(item.dt_txt).getDate() === uniqueDays[index]);
                const fIcon = forecast.weather[0].icon;
                const weekday = new Date(forecast.dt_txt).toLocaleDateString('en-US', { weekday: 'short' });
                day.querySelector('.weekday').textContent = weekday;
                day.querySelector('.icon').innerHTML = `<img src="https://openweathermap.org/img/wn/${fIcon}@2x.png">`;
                day.querySelector('.temp').textContent = `${Math.round(forecast.main.temp)}°C`;
            }
        });

        loading.style.display = 'none';
        weatherContainer.style.display = 'block';
    } catch (error) {
        loading.style.display = 'none';
        showError(error.message);
    }
}

async function askAI() {
    const input = document.getElementById('ai-input');
    const chat = document.getElementById('chat-window');
    const question = input.value.trim();
    if (!question || !weatherContext) return;

    chat.innerHTML += `<div style="color: #FFD700; margin-top: 5px;">You: ${question}</div>`;
    input.value = "";

    const GEMINI_KEY = "AIzaSyACGKwusG_9Zy8ss2cSiqL11rVmOQafJEw"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Weather: ${weatherContext}. User: ${question}. Short answer please.` }] }] })
        });
        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        chat.innerHTML += `<div style="margin-top: 5px;">AI: ${aiText}</div>`;
        chat.scrollTop = chat.scrollHeight;
    } catch (e) {
        chat.innerHTML += `<div style="color: red;">Error connecting to AI.</div>`;
    }
}

function handleEnter(e) { if (e.key === 'Enter') getWeather(); }
function showError(m) { const e = document.getElementById('error-message'); e.textContent = m; e.style.display = 'block'; }
function changeBackground(condition) {
    const body = document.body;
    body.className = '';
    const map = { 'clear': 'clear', 'clouds': 'clouds', 'rain': 'rain', 'drizzle': 'rain', 'snow': 'snow' };
    body.classList.add(map[condition] || 'default');
}
