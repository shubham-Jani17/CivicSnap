export const LocationService = {
  async getAddressFromCoordinates(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            "Accept-Language": "en"
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const addressParts = data.display_name.split(",");
          const mainAddress = addressParts.slice(0, 4).join(",").trim();
          return mainAddress || data.display_name;
        }
      }
    } catch (err) {
      console.warn("Reverse address lookup failed:", err);
    }
    return `Sector Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  },

  async getCoordinatesFromAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const query = encodeURIComponent(address.trim());
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        {
          headers: {
            "Accept-Language": "en"
          }
        }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lon = parseFloat(geoData[0].lon);
          return { latitude: lat, longitude: lon };
        }
      }
    } catch (err) {
      console.warn("Forward geocoding lookup failed:", err);
    }
    return null;
  },

  getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => reject(err),
          { timeout: 7000, enableHighAccuracy: true }
        );
      } else {
        reject(new Error("Browser geolocation is not supported on this device."));
      }
    });
  }
};
