import { fetchAirQualityTelemetry, PRESET_CITIES } from "@/lib/open-meteo";
import { AirQualityDashboard } from "@/components/AirQualityDashboard";

export default async function HomePage() {
  const initialTelemetry = await fetchAirQualityTelemetry(PRESET_CITIES[0]);
  return <AirQualityDashboard initialTelemetry={initialTelemetry} />;
}
