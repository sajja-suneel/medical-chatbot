# backend/app/services/weather.py
import requests
from typing import Dict, Any
from app.config.settings import OPENWEATHER_API_KEY
from app.rag.log import logger

class WeatherService:
    """Service to connect to OpenWeatherMap and determine environmental health risks."""

    def __init__(self, api_key: str = OPENWEATHER_API_KEY):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"

    def get_weather_with_health_tips(self, city: str = None, lat: float = None, lon: float = None) -> Dict[str, Any]:
        """Fetches current weather by city name or lat/lon coordinates and returns health tips."""
        if not self.api_key:
            return {"error": "Weather API key not configured."}

        params = {
            "appid": self.api_key,
            "units": "metric"
        }

        if lat is not None and lon is not None:
            params["lat"] = lat
            params["lon"] = lon
        elif city:
            params["q"] = city
        else:
            params["q"] = "Tirupati"

        try:
            logger.info(f"Querying Weather API: params={params}")
            response = requests.get(self.base_url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                temp = data["main"]["temp"]
                humidity = data["main"]["humidity"]
                weather_desc = data["weather"][0]["description"].title()
                
                health_advisory = "Weather is pleasant. Great day for outdoor activities!"
                icon_code = "☀️"
                
                if temp >= 35:
                    health_advisory = "Extreme heat warning! Stay hydrated, seek shade, and avoid outdoor activity."
                    icon_code = "🌡️"
                elif temp <= 15:
                    health_advisory = "Cold weather warning. Keep warm to prevent joint stiffness and seasonal colds."
                    icon_code = "❄️"
                elif humidity >= 80:
                    health_advisory = "High humidity detected. Mold spores and asthma triggers are active. Keep inhalers ready."
                    icon_code = "🌫️"
                elif "rain" in weather_desc.lower() or "drizzle" in weather_desc.lower():
                    health_advisory = "Rainy conditions. Carry an umbrella and dress warmly to prevent influenza."
                    icon_code = "🌧️"

                return {
                    "success": True,
                    "city": data["name"],
                    "temp": round(temp, 1),
                    "humidity": humidity,
                    "description": weather_desc,
                    "health_advisory": health_advisory,
                    "icon": icon_code
                }
            
            return {"success": False, "error": f"API status: {response.status_code}"}
        except Exception as e:
            logger.error(f"Weather fetch exception: {e}")
            return {"success": False, "error": str(e)}