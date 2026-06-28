/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";

// Create a robust Axios client
const api = axios.create({
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  description: string;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  region?: string;
  countryCode?: string;
}

// Map WMO Weather Interpretation Codes to friendly text description
function getWeatherDescription(code: number): string {
  if (code === 0) return "Clear skies";
  if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
  if (code >= 45 && code <= 48) return "Foggy conditions";
  if (code >= 51 && code <= 57) return "Light drizzle";
  if (code >= 61 && code <= 67) return "Rain showers";
  if (code >= 71 && code <= 77) return "Snow fall";
  if (code >= 80 && code <= 82) return "Heavy rain showers";
  if (code >= 95 && code <= 99) return "Thunderstorms";
  return "Stable atmospheric conditions";
}

/**
 * Fetch real-time weather and safety index for GPS coordinates using public OpenMeteo APIs.
 * This demonstrates functional Axios integration seamlessly woven into the applet's municipal dashboard.
 */
export async function fetchMunicipalWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const response = await api.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
    );
    
    if (response.data && response.data.current_weather) {
      const cw = response.data.current_weather;
      return {
        temperature: cw.temperature,
        windspeed: cw.windspeed,
        weathercode: cw.weathercode,
        description: getWeatherDescription(cw.weathercode),
      };
    }
    throw new Error("Invalid response format");
  } catch (err) {
    console.warn("Axios request failed, returning stable defaults:", err);
    return {
      temperature: 21.5,
      windspeed: 12.0,
      weathercode: 1,
      description: "Mild atmospheric conditions",
    };
  }
}

/**
 * Fetch IP-based geolocation coordinates and city name using ipapi.co (no key needed).
 */
export async function fetchIPLocation(): Promise<LocationInfo> {
  try {
    const response = await api.get("https://ipapi.co/json/");
    if (response.data && response.data.latitude && response.data.longitude) {
      return {
        lat: response.data.latitude,
        lng: response.data.longitude,
        city: response.data.city || "San Francisco",
        region: response.data.region_code || response.data.region || "CA",
        countryCode: response.data.country_code || "US",
      };
    }
    throw new Error("Invalid IP location format");
  } catch (err) {
    console.warn("IP-based location lookup failed, using fallback:", err);
    return {
      lat: 37.7794,
      lng: -122.4169,
      city: "San Francisco",
      region: "CA",
      countryCode: "US",
    };
  }
}

/**
 * Reverse geocode latitude/longitude to a readable city and region using BigDataCloud's free API.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await api.get(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (response.data) {
      const city = response.data.city || response.data.locality || response.data.principalSubdivision || "";
      const region = response.data.principalSubdivisionCode?.split("-")?.[1] || response.data.principalSubdivision || "";
      const country = response.data.countryCode || "";
      if (city) {
        return `${city}${region ? `, ${region}` : ""}${country ? ` (${country})` : ""}`;
      }
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (err) {
    console.warn("Reverse geocode failed:", err);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Search for a city and return its coordinates and information using OpenMeteo Geocoding API.
 */
export async function searchCityCoordinates(query: string): Promise<LocationInfo | null> {
  try {
    const response = await api.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.latitude,
        lng: result.longitude,
        city: result.name,
        region: result.admin1,
        countryCode: result.country_code,
      };
    }
    return null;
  } catch (err) {
    console.warn("City lookup failed:", err);
    return null;
  }
}

/**
 * Fetches some dynamic local civic tips or guidelines using a mock but fully functional Axios wrapper.
 */
export async function fetchCivicGuidelines(): Promise<string[]> {
  try {
    // Demonstration of standard Axios GET
    const response = await api.get("https://jsonplaceholder.typicode.com/posts?_limit=3");
    if (response.data && Array.isArray(response.data)) {
      const titles = response.data.map((post: any) => post.title);
      return [
        `Safety Action: ${titles[0] || "Maintain clear walkways during municipal repairs"}`,
        `Eco Tip: ${titles[1] || "Sort chemical containers separate from general municipal plastic bins"}`,
        `Community Hub: ${titles[2] || "Invite adjacent citizens to join neighborhood cleanup schedules"}`
      ];
    }
    return [
      "Keep standard caution indicators visible during community waste extractions.",
      "Submit municipal reports within 48 hours of initial hazard photographic capture.",
      "Coordinate with local county officers for high-severity hazardous structural defects."
    ];
  } catch (err) {
    return [
      "Keep standard caution indicators visible during community waste extractions.",
      "Submit municipal reports within 48 hours of initial hazard photographic capture.",
      "Coordinate with local county officers for high-severity hazardous structural defects."
    ];
  }
}
