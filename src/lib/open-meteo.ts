import { CityLocation, HourlyPoint, TelemetrySnapshot } from "@/types/air-quality";

/** Region groupings for the UI */
export interface CityGroup {
    region: string;
    cities: CityLocation[];
}

export const CITY_GROUPS: CityGroup[] = [
    {
        region: "North India",
        cities: [
            { id: 1273294, name: "Delhi", country: "India", admin1: "Delhi", latitude: 28.6519, longitude: 77.2315 },
            { id: 1264527, name: "Lucknow", country: "India", admin1: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462 },
            { id: 1262180, name: "Noida", country: "India", admin1: "Uttar Pradesh", latitude: 28.5355, longitude: 77.391 },
            { id: 1262321, name: "Gurugram", country: "India", admin1: "Haryana", latitude: 28.4595, longitude: 77.0266 },
            { id: 1275004, name: "Chandigarh", country: "India", admin1: "Chandigarh", latitude: 30.7333, longitude: 76.7794 },
            { id: 1269515, name: "Jaipur", country: "India", admin1: "Rajasthan", latitude: 26.9124, longitude: 75.7873 },
            { id: 1262393, name: "Kanpur", country: "India", admin1: "Uttar Pradesh", latitude: 26.4499, longitude: 80.3319 },
            { id: 1253102, name: "Varanasi", country: "India", admin1: "Uttar Pradesh", latitude: 25.3176, longitude: 82.9739 },
            { id: 1259229, name: "Patna", country: "India", admin1: "Bihar", latitude: 25.6117, longitude: 85.1446 },
            { id: 1256237, name: "Shimla", country: "India", admin1: "Himachal Pradesh", latitude: 31.1048, longitude: 77.1734 },
            { id: 1267995, name: "Agra", country: "India", admin1: "Uttar Pradesh", latitude: 27.1767, longitude: 78.0081 },
            { id: 1263780, name: "Meerut", country: "India", admin1: "Uttar Pradesh", latitude: 28.9845, longitude: 77.7064 },
            { id: 1266285, name: "Dehradun", country: "India", admin1: "Uttarakhand", latitude: 30.3165, longitude: 78.0322 },
            { id: 1261731, name: "Prayagraj", country: "India", admin1: "Uttar Pradesh", latitude: 25.4358, longitude: 81.8463 },
            { id: 1260086, name: "Amritsar", country: "India", admin1: "Punjab", latitude: 31.634, longitude: 74.8723 },
            { id: 1263364, name: "Ludhiana", country: "India", admin1: "Punjab", latitude: 30.901, longitude: 75.8573 },
        ],
    },
    {
        region: "South India",
        cities: [
            { id: 1277333, name: "Bengaluru", country: "India", admin1: "Karnataka", latitude: 12.9719, longitude: 77.5937 },
            { id: 1269843, name: "Hyderabad", country: "India", admin1: "Telangana", latitude: 17.384, longitude: 78.4564 },
            { id: 1264527, name: "Chennai", country: "India", admin1: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707 },
            { id: 1259091, name: "Kochi", country: "India", admin1: "Kerala", latitude: 9.9312, longitude: 76.2673 },
            { id: 1254163, name: "Thiruvananthapuram", country: "India", admin1: "Kerala", latitude: 8.5241, longitude: 76.9366 },
            { id: 1253184, name: "Visakhapatnam", country: "India", admin1: "Andhra Pradesh", latitude: 17.6868, longitude: 83.2185 },
            { id: 1264521, name: "Madurai", country: "India", admin1: "Tamil Nadu", latitude: 9.9252, longitude: 78.1198 },
            { id: 1259652, name: "Coimbatore", country: "India", admin1: "Tamil Nadu", latitude: 11.0168, longitude: 76.9558 },
            { id: 1268534, name: "Kadapa", country: "India", admin1: "Andhra Pradesh", latitude: 14.4673, longitude: 78.8242 },
            { id: 1253573, name: "Vijayawada", country: "India", admin1: "Andhra Pradesh", latitude: 16.5062, longitude: 80.648 },
            { id: 1262321, name: "Mysuru", country: "India", admin1: "Karnataka", latitude: 12.2958, longitude: 76.6394 },
            { id: 1253405, name: "Tirupati", country: "India", admin1: "Andhra Pradesh", latitude: 13.6288, longitude: 79.4192 },
            { id: 1265683, name: "Mangaluru", country: "India", admin1: "Karnataka", latitude: 12.9141, longitude: 74.856 },
            { id: 1254388, name: "Hubli", country: "India", admin1: "Karnataka", latitude: 15.3647, longitude: 75.124 },
        ],
    },
    {
        region: "West India",
        cities: [
            { id: 1275339, name: "Mumbai", country: "India", admin1: "Maharashtra", latitude: 19.0728, longitude: 72.8826 },
            { id: 1270642, name: "Ahmedabad", country: "India", admin1: "Gujarat", latitude: 23.0225, longitude: 72.5714 },
            { id: 1259229, name: "Pune", country: "India", admin1: "Maharashtra", latitude: 18.5204, longitude: 73.8567 },
            { id: 1264541, name: "Surat", country: "India", admin1: "Gujarat", latitude: 21.1702, longitude: 72.8311 },
            { id: 1262180, name: "Nagpur", country: "India", admin1: "Maharashtra", latitude: 21.1458, longitude: 79.0882 },
            { id: 1265711, name: "Vadodara", country: "India", admin1: "Gujarat", latitude: 22.3072, longitude: 73.1812 },
            { id: 1266330, name: "Rajkot", country: "India", admin1: "Gujarat", latitude: 22.3039, longitude: 70.8022 },
            { id: 1259395, name: "Nashik", country: "India", admin1: "Maharashtra", latitude: 19.9975, longitude: 73.7898 },
            { id: 1275817, name: "Goa", country: "India", admin1: "Goa", latitude: 15.4909, longitude: 73.8278 },
            { id: 1269300, name: "Indore", country: "India", admin1: "Madhya Pradesh", latitude: 22.7196, longitude: 75.8577 },
            { id: 1275841, name: "Bhopal", country: "India", admin1: "Madhya Pradesh", latitude: 23.2599, longitude: 77.4126 },
            { id: 1266330, name: "Jodhpur", country: "India", admin1: "Rajasthan", latitude: 26.2389, longitude: 73.0243 },
            { id: 1259395, name: "Udaipur", country: "India", admin1: "Rajasthan", latitude: 24.5854, longitude: 73.7125 },
        ],
    },
    {
        region: "East India",
        cities: [
            { id: 1275004, name: "Kolkata", country: "India", admin1: "West Bengal", latitude: 22.5726, longitude: 88.3639 },
            { id: 1263364, name: "Bhubaneswar", country: "India", admin1: "Odisha", latitude: 20.2961, longitude: 85.8245 },
            { id: 1261731, name: "Guwahati", country: "India", admin1: "Assam", latitude: 26.1445, longitude: 91.7362 },
            { id: 1263780, name: "Ranchi", country: "India", admin1: "Jharkhand", latitude: 23.3441, longitude: 85.3096 },
            { id: 1253102, name: "Raipur", country: "India", admin1: "Chhattisgarh", latitude: 21.2514, longitude: 81.6296 },
            { id: 1265683, name: "Jamshedpur", country: "India", admin1: "Jharkhand", latitude: 22.8046, longitude: 86.2029 },
            { id: 1253573, name: "Siliguri", country: "India", admin1: "West Bengal", latitude: 26.7271, longitude: 88.3953 },
            { id: 1253405, name: "Imphal", country: "India", admin1: "Manipur", latitude: 24.817, longitude: 93.9368 },
        ],
    },
    {
        region: "World — Most Polluted",
        cities: [
            { id: 1185241, name: "Dhaka", country: "Bangladesh", admin1: "Dhaka", latitude: 23.8103, longitude: 90.4125 },
            { id: 1176615, name: "Lahore", country: "Pakistan", admin1: "Punjab", latitude: 31.5497, longitude: 74.3436 },
            { id: 1176615, name: "Karachi", country: "Pakistan", admin1: "Sindh", latitude: 24.8607, longitude: 67.0011 },
            { id: 1283240, name: "Kathmandu", country: "Nepal", admin1: "Bagmati", latitude: 27.7172, longitude: 85.324 },
            { id: 360630, name: "Cairo", country: "Egypt", admin1: "Cairo", latitude: 30.0444, longitude: 31.2357 },
            { id: 745044, name: "Istanbul", country: "Turkey", admin1: "Istanbul", latitude: 41.0082, longitude: 28.9784 },
            { id: 1816670, name: "Beijing", country: "China", admin1: "Beijing", latitude: 39.9042, longitude: 116.4074 },
            { id: 1796236, name: "Shanghai", country: "China", admin1: "Shanghai", latitude: 31.2304, longitude: 121.4737 },
            { id: 1609350, name: "Bangkok", country: "Thailand", admin1: "Bangkok", latitude: 13.7563, longitude: 100.5018 },
            { id: 1642911, name: "Jakarta", country: "Indonesia", admin1: "Jakarta", latitude: -6.2088, longitude: 106.8456 },
            { id: 2988507, name: "Paris", country: "France", admin1: "Île-de-France", latitude: 48.8566, longitude: 2.3522 },
            { id: 2643743, name: "London", country: "UK", admin1: "England", latitude: 51.5074, longitude: -0.1278 },
        ],
    },
    {
        region: "World — Cleanest",
        cities: [
            { id: 2147714, name: "Sydney", country: "Australia", admin1: "NSW", latitude: -33.8688, longitude: 151.2093 },
            { id: 5128581, name: "New York", country: "USA", admin1: "New York", latitude: 40.7128, longitude: -74.006 },
            { id: 5391959, name: "San Francisco", country: "USA", admin1: "California", latitude: 37.7749, longitude: -122.4194 },
            { id: 1850147, name: "Tokyo", country: "Japan", admin1: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
            { id: 2950159, name: "Berlin", country: "Germany", admin1: "Berlin", latitude: 52.52, longitude: 13.405 },
            { id: 3169070, name: "Rome", country: "Italy", admin1: "Lazio", latitude: 41.9028, longitude: 12.4964 },
            { id: 6167865, name: "Toronto", country: "Canada", admin1: "Ontario", latitude: 43.6532, longitude: -79.3832 },
            { id: 1835848, name: "Seoul", country: "South Korea", admin1: "Seoul", latitude: 37.5665, longitude: 126.978 },
            { id: 1880252, name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198 },
            { id: 2759794, name: "Amsterdam", country: "Netherlands", admin1: "North Holland", latitude: 52.3676, longitude: 4.9041 },
            { id: 3143244, name: "Oslo", country: "Norway", admin1: "Oslo", latitude: 59.9139, longitude: 10.7522 },
            { id: 2673730, name: "Stockholm", country: "Sweden", admin1: "Stockholm", latitude: 59.3293, longitude: 18.0686 },
        ],
    },
];

/** Flat list of all preset cities for quick iteration */
export const PRESET_CITIES: CityLocation[] = CITY_GROUPS.flatMap((g) => g.cities);

/** Featured quick-pick cities shown as chips in the header */
export const FEATURED_CITIES: CityLocation[] = [
    CITY_GROUPS[0].cities[0],  // Delhi
    CITY_GROUPS[1].cities[0],  // Bengaluru
    CITY_GROUPS[1].cities[1],  // Hyderabad
    CITY_GROUPS[2].cities[0],  // Mumbai
    CITY_GROUPS[1].cities[2],  // Chennai
    CITY_GROUPS[3].cities[0],  // Kolkata
    CITY_GROUPS[0].cities[1],  // Lucknow
    CITY_GROUPS[2].cities[1],  // Ahmedabad
];

export async function searchCities(query: string): Promise<CityLocation[]> {
    if (!query || query.trim().length < 2) return [];

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query.trim()
    )}&count=15&language=en&format=json`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: Record<string, unknown>) => ({
        id: Number(item.id),
        name: String(item.name),
        country: String(item.country ?? ""),
        admin1: item.admin1 ? String(item.admin1) : undefined,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
    }));
}

/** Reverse geocode: find the nearest city from lat/lon */
export async function reverseGeocode(lat: number, lon: number): Promise<CityLocation | null> {
    // Find the nearest preset city first
    let nearest: CityLocation | null = null;
    let minDist = Infinity;
    for (const city of PRESET_CITIES) {
        const dist = Math.sqrt(
            Math.pow(city.latitude - lat, 2) + Math.pow(city.longitude - lon, 2)
        );
        if (dist < minDist) {
            minDist = dist;
            nearest = city;
        }
    }
    // If within ~1 degree (~100km), use the preset
    if (nearest && minDist < 1) return nearest;

    // Otherwise search Open-Meteo geocoding for the nearest named place
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=city&count=1&language=en&format=json&latitude=${lat}&longitude=${lon}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.results?.[0]) {
                const item = data.results[0];
                return {
                    id: Number(item.id),
                    name: String(item.name),
                    country: String(item.country ?? ""),
                    admin1: item.admin1 ? String(item.admin1) : undefined,
                    latitude: Number(item.latitude),
                    longitude: Number(item.longitude),
                };
            }
        }
    } catch {
        // Fall through
    }

    // Return a custom city based on coordinates
    return nearest ?? {
        id: Math.round(lat * 1000 + lon),
        name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
        country: "Your Location",
        latitude: lat,
        longitude: lon,
    };
}

export async function fetchAirQualityTelemetry(city: CityLocation): Promise<TelemetrySnapshot> {
    const params = new URLSearchParams({
        latitude: city.latitude.toString(),
        longitude: city.longitude.toString(),
        current: "us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index",
        hourly: "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
        timezone: "auto",
        forecast_days: "1",
    });

    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
        throw new Error(`Air quality data fetch error: ${res.status}`);
    }

    const raw = await res.json();
    const c = raw.current ?? {};
    const h = raw.hourly ?? {};

    const times: string[] = h.time ?? [];
    const hourly: HourlyPoint[] = times.slice(0, 24).map((t, idx) => ({
        time: t.split("T")[1] ?? t,
        usAqi: Number(h.us_aqi?.[idx] ?? 0),
        pm25: Number(h.pm2_5?.[idx] ?? 0),
        pm10: Number(h.pm10?.[idx] ?? 0),
        no2: Number(h.nitrogen_dioxide?.[idx] ?? 0),
        o3: Number(h.ozone?.[idx] ?? 0),
    }));

    return {
        city,
        timestamp: c.time ?? new Date().toISOString(),
        current: {
            usAqi: Math.round(Number(c.us_aqi ?? 0)),
            pm25: Number(Number(c.pm2_5 ?? 0).toFixed(1)),
            pm10: Number(Number(c.pm10 ?? 0).toFixed(1)),
            no2: Number(Number(c.nitrogen_dioxide ?? 0).toFixed(1)),
            so2: Number(Number(c.sulphur_dioxide ?? 0).toFixed(1)),
            co: Math.round(Number(c.carbon_monoxide ?? 0)),
            o3: Number(Number(c.ozone ?? 0).toFixed(1)),
            dust: Number(Number(c.dust ?? 0).toFixed(1)),
            uvIndex: Number(Number(c.uv_index ?? 0).toFixed(1)),
        },
        hourly,
    };
}
