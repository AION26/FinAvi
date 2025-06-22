export async function getWeatherRisk(lat: number, lon: number): Promise<number> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,precipitation,cloudcover&forecast_days=1`;
  const res = await fetch(url);
  const data = await res.json();

  const wind = data.hourly.wind_speed_10m[0];
  const rain = data.hourly.precipitation[0];
  const cloud = data.hourly.cloudcover[0];

  let score = 0;
  if (wind > 25) score += 3;
  else if (wind > 15) score += 2;
  else if (wind > 8) score += 1;

  if (rain > 3) score += 3;
  else if (rain > 1) score += 2;
  else if (rain > 0.1) score += 1;

  if (cloud > 80) score += 2;
  else if (cloud > 50) score += 1;

  return Math.min(score, 10);
}
