// utils/riskCalculator.ts

// Weather risk weights (adjust based on importance)
const WEATHER_RISK_WEIGHTS = {
  temperature: 0.3,
  windSpeed: 0.4,
  humidity: 0.2,
  condition: 0.1
};

// Thresholds for risk calculation (customize as needed)
const RISK_THRESHOLDS = {
  temperature: { min: -20, max: 40 }, // Celsius
  windSpeed: { high: 30, extreme: 50 }, // km/h
  humidity: { high: 80 } // percentage
};

export const calculateWeatherRisk = (weatherData: {
  temperature: number;
  windSpeed: number;
  humidity: number;
  condition: string;
}): number => {
  let riskScore = 0;

  // Temperature risk
  if (weatherData.temperature < RISK_THRESHOLDS.temperature.min || 
      weatherData.temperature > RISK_THRESHOLDS.temperature.max) {
    riskScore += WEATHER_RISK_WEIGHTS.temperature * 10;
  } else {
    // Linear interpolation for temperature risk
    const tempRange = RISK_THRESHOLDS.temperature.max - RISK_THRESHOLDS.temperature.min;
    const tempDeviation = Math.max(
      RISK_THRESHOLDS.temperature.min - weatherData.temperature,
      weatherData.temperature - RISK_THRESHOLDS.temperature.max,
      0
    );
    riskScore += WEATHER_RISK_WEIGHTS.temperature * (tempDeviation / tempRange) * 10;
  }

  // Wind speed risk
  if (weatherData.windSpeed >= RISK_THRESHOLDS.windSpeed.extreme) {
    riskScore += WEATHER_RISK_WEIGHTS.windSpeed * 10;
  } else if (weatherData.windSpeed >= RISK_THRESHOLDS.windSpeed.high) {
    riskScore += WEATHER_RISK_WEIGHTS.windSpeed * 7;
  } else {
    riskScore += WEATHER_RISK_WEIGHTS.windSpeed * (weatherData.windSpeed / RISK_THRESHOLDS.windSpeed.high) * 5;
  }

  // Humidity risk
  if (weatherData.humidity >= RISK_THRESHOLDS.humidity.high) {
    riskScore += WEATHER_RISK_WEIGHTS.humidity * 5;
  }

  // Weather condition risk (simplified)
  const badConditions = ['thunderstorm', 'heavy rain', 'blizzard', 'fog'];
  if (badConditions.includes(weatherData.condition.toLowerCase())) {
    riskScore += WEATHER_RISK_WEIGHTS.condition * 8;
  }

  // Normalize to 1-10 scale
  return Math.min(Math.max(Math.round(riskScore), 1), 10);
};

export const calculateWarZoneRisk = async (lat: number, lon: number): Promise<number> => {
  try {
    // In a real app, you would call a geopolitical API here
    // For now, we'll keep the random value but with better distribution
    return Math.floor(Math.random() * 10) + 1;
  } catch (error) {
    console.error("Error calculating war zone risk:", error);
    return 5; // Default medium risk
  }
};

export const calculateOverallRisk = (weatherRisk: number, warZoneRisk: number): number => {
  // Weighted average (adjust weights as needed)
  const weights = { weather: 0.6, warZone: 0.4 };
  const overall = (weatherRisk * weights.weather) + (warZoneRisk * weights.warZone);
  return Math.min(Math.max(Math.round(overall), 1), 10);
};