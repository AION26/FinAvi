// types/weatherRisk.ts
export type WeatherRiskData = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  score: number;
  weather: {
    wind: number;
    rain: number;
    cloud: number;
  };
};

// utils/weatherRiskCalculator.ts
export async function getWeatherRisk(
  lat: number, 
  lon: number
): Promise<WeatherRiskData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,cloudcover&current_weather=true&forecast_days=1`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API failed with status ${res.status}`);
    }
    
    const data = await res.json();

    // Validate response structure
    if (!data.hourly || !data.current_weather) {
      throw new Error('Invalid weather data structure');
    }

    const [wind, rain, cloud, temperature, humidity] = [
      data.hourly.wind_speed_10m[0] ?? 0,
      data.hourly.precipitation[0] ?? 0,
      data.hourly.cloudcover[0] ?? 0,
      data.hourly.temperature_2m[0] ?? data.current_weather.temperature,
      data.hourly.relative_humidity_2m[0] ?? 0,
    ];

    // Calculate risk scores with weighted factors
    const windRisk = calculateWindRisk(wind);
    const rainRisk = calculateRainRisk(rain);
    const cloudRisk = calculateCloudRisk(cloud);
    const tempRisk = calculateTemperatureRisk(temperature);
    const humidityRisk = calculateHumidityRisk(humidity);

    // Weighted total score (adjust weights as needed)
    const totalScore = Math.min(
      (windRisk * 0.3) +
      (rainRisk * 0.25) +
      (cloudRisk * 0.15) +
      (tempRisk * 0.2) +
      (humidityRisk * 0.1),
      10
    );

    return {
      temperature,
      humidity,
      condition: getWeatherCondition(rain, cloud, wind),
      windSpeed: wind,
      score: Math.round(totalScore),
      weather: {
        wind,
        rain,
        cloud,
      },
    };
  } catch (error) {
    console.error('Failed to fetch weather risk:', error);
    // Return default safe values in case of error
    return getDefaultWeatherRiskData();
  }
}

// Helper functions
function calculateWindRisk(windSpeed: number): number {
  if (windSpeed > 30) return 10; // Storm/hurricane
  if (windSpeed > 20) return 7;  // Strong wind
  if (windSpeed > 12) return 4;  // Moderate wind
  if (windSpeed > 6) return 2;   // Light breeze
  return 1;                       // Calm
}

function calculateRainRisk(precipitation: number): number {
  if (precipitation > 10) return 10; // Heavy downpour
  if (precipitation > 5) return 7;   // Heavy rain
  if (precipitation > 2) return 5;   // Moderate rain
  if (precipitation > 0.5) return 3; // Light rain
  return 1;                          // No rain
}

function calculateCloudRisk(cloudCover: number): number {
  if (cloudCover > 90) return 5;  // Overcast
  if (cloudCover > 70) return 3;  // Mostly cloudy
  if (cloudCover > 30) return 2;  // Partly cloudy
  return 1;                       // Clear
}

function calculateTemperatureRisk(temp: number): number {
  if (temp > 35 || temp < -10) return 10; // Extreme
  if (temp > 30 || temp < -5) return 7;   // Very high/low
  if (temp > 25 || temp < 0) return 4;    // High/low
  return 1;                               // Comfortable
}

function calculateHumidityRisk(humidity: number): number {
  if (humidity > 90) return 5;  // Very high
  if (humidity > 70) return 3;  // High
  if (humidity < 30) return 2;  // Low
  return 1;                     // Comfortable
}

function getWeatherCondition(rain: number, cloud: number, wind: number): string {
  if (rain > 5) return 'Heavy Rain';
  if (rain > 0.5) return 'Rain';
  if (wind > 25) return 'Windy';
  if (cloud > 80) return 'Overcast';
  if (cloud > 50) return 'Partly Cloudy';
  return 'Clear';
}

function getDefaultWeatherRiskData(): WeatherRiskData {
  return {
    temperature: 20,
    humidity: 50,
    condition: 'Clear',
    windSpeed: 5,
    score: 1, // Lowest risk
    weather: {
      wind: 5,
      rain: 0,
      cloud: 20,
    },
  };
}