const apiKey = "37fddc43c716f581cf78c39c010991ce";

    async function getWeather() {
        const city = document.getElementById("cityInput").value.trim();
        if (!city) {
            showError("Please enter a city name.");
            return;
        }
        showLoader();
        try {
            const geoData = await fetchGeoData(city);
            if (!geoData) throw new Error("City not found.");
            const { lat, lon, name, country } = geoData;
            const weatherData = await fetchWeather(lat, lon);
            displayWeather(lat, lon, name, country, weatherData);
        } catch (err) {
            showError(err.message);
        }
    }

    function getLocationWeather() {
        showLoader();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async pos => {
                try {
                    const { latitude, longitude } = pos.coords;
                    console.log("Location:", latitude, longitude);
                    const reverseGeo = await fetchReverseGeo(latitude, longitude);
                    const { name, country } = reverseGeo || { name: "Unknown", country: "" };
                    const weatherData = await fetchWeather(latitude, longitude);
                    displayWeather(latitude, longitude, name, country, weatherData);
                } catch (err) {
                    showError(err.message);
                }
            }, err => {
                console.error("Geolocation error:", err);
                showError("Unable to get location. Please allow access or enter a city.");
            });
        } else {
            showError("Geolocation not supported.");
        }
    }

   async function fetchGeoData(city) {
    // First attempt: as entered
    let geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
    let res = await fetch(geoUrl);
    let data = await res.json();

    // If no result, try appending ",NG" for Nigeria
    if (!data.length) {
        console.warn(`No match for "${city}", retrying with Nigeria fallback...`);
        geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)},NG&limit=1&appid=${apiKey}`;
        res = await fetch(geoUrl);
        data = await res.json();
    }

    return data.length ? data[0] : null;
}


    async function fetchReverseGeo(lat, lon) {
        const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.length ? data[0] : null;
    }

    async function fetchWeather(lat, lon) {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const res = await fetch(weatherUrl);
        return res.json();
    }

    async function fetchForecast(lat, lon) {
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const res = await fetch(forecastUrl);
        const data = await res.json();
        const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
        return daily.slice(0, 5);
    }

    async function displayWeather(lat, lon, name, country, data) {
        document.getElementById("error").textContent = "";
        document.getElementById("weather").innerHTML = `
            <h3>${name}, ${country}</h3>
            <p>${new Date().toLocaleString()}</p>
            <img class="weather-icon" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" />
            <p><strong>${data.main.temp}°C</strong></p>
            <p>${data.weather[0].description}</p>
            <p>Humidity: ${data.main.humidity}%</p>
            <p>Wind: ${data.wind.speed} m/s</p>
        `;
        const forecastData = await fetchForecast(lat, lon);
        displayForecast(forecastData);
    }

    function displayForecast(forecastData) {
        const forecastDiv = document.getElementById("forecast");
        forecastDiv.innerHTML = forecastData.map(day => `
            <div class="forecast-day">
                <p>${new Date(day.dt_txt).toLocaleDateString()}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" />
                <p>${day.main.temp}°C</p>
                <p>${day.weather[0].description}</p>
            </div>
        `).join("");
    }

    function showLoader() {
        document.getElementById("weather").innerHTML = `<div class="loader"></div>`;
        document.getElementById("forecast").innerHTML = "";
        document.getElementById("error").textContent = "";
    }

    function showError(msg) {
        document.getElementById("weather").innerHTML = "";
        document.getElementById("forecast").innerHTML = "";
        document.getElementById("error").textContent = msg;
    }