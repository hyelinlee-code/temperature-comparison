export interface DailyWeather {
  time: string;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  sameHourTemp: number;
}

export interface WeatherData {
  yesterday: DailyWeather;
  today: DailyWeather;
  current: {
    weatherCode: number;
    isDay: number;
    temp: number;
  };
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&hourly=temperature_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&past_days=1&forecast_days=2`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();
  
  // Find the exact hour match for yesterday.
  // data.current.time looks like "2023-08-16T15:15"
  const currentHourPrefix = data.current.time.substring(0, 14); // "2023-08-16T15:"
  const currentIndex = data.hourly.time.findIndex((t: string) => t.startsWith(currentHourPrefix));
  
  // If for some reason not found, fallback to roughly 24 hours before now based on local hour
  const yesterdayIndex = currentIndex !== -1 && currentIndex >= 24 ? currentIndex - 24 : new Date().getHours();

  return {
    yesterday: {
      time: data.daily.time[0],
      weatherCode: data.daily.weather_code[0],
      maxTemp: data.daily.temperature_2m_max[0],
      minTemp: data.daily.temperature_2m_min[0],
      sameHourTemp: data.hourly.temperature_2m[yesterdayIndex],
    },
    today: {
      time: data.daily.time[1],
      weatherCode: data.daily.weather_code[1],
      maxTemp: data.daily.temperature_2m_max[1],
      minTemp: data.daily.temperature_2m_min[1],
      sameHourTemp: data.current.temperature_2m, // For today, sameHourTemp is just right now.
    },
    current: {
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day,
      temp: data.current.temperature_2m,
    }
  };
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const data = await response.json();
    return data.city || data.locality || data.principalSubdivision || "Unknown Location";
  } catch (error) {
    console.error("Geocoding error", error);
    return "Your Location";
  }
}

export function fahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function formatTemp(temp: number, unit: 'C' | 'F'): string {
  const t = unit === 'C' ? temp : fahrenheit(temp);
  return `${Math.round(t)}°${unit}`;
}

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunder';

export function getWeatherType(code: number): WeatherType {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'cloudy'; // Fog
  if (code <= 67) return 'rain'; // Drizzle / Rain
  if (code <= 77) return 'snow'; // Snow
  if (code <= 82) return 'rain'; // Showers
  if (code <= 86) return 'snow'; // Snow showers
  if (code >= 95) return 'thunder'; // Thunderstorm
  return 'clear';
}
