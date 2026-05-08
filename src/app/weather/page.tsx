"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Location = {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type CurrentBlock = {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  is_day: number;
  precipitation: number;
};

type HourlyBlock = {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
  is_day: number[];
  uv_index: number[];
};

type DailyBlock = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
  sunrise: string[];
  sunset: string[];
  precipitation_probability_max: number[];
  uv_index_max: number[];
};

type Forecast = {
  current: CurrentBlock;
  hourly: HourlyBlock;
  daily: DailyBlock;
  timezone: string;
  utc_offset_seconds: number;
  current_units: { temperature_2m: string; wind_speed_10m: string };
};

type GeocodeResult = {
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type Unit = "imperial" | "metric";

const STORAGE_KEY = "weather:v1";
const DEFAULT_LOCATION: Location = {
  name: "Austin",
  region: "Texas",
  country: "United States",
  latitude: 30.2672,
  longitude: -97.7431,
  timezone: "America/Chicago",
};

function describeCode(code: number, isDay: boolean): { glyph: string; label: string } {
  // WMO weather interpretation codes
  if (code === 0) return { glyph: isDay ? "☀" : "☾", label: "clear" };
  if (code === 1) return { glyph: isDay ? "☀" : "☾", label: "mostly clear" };
  if (code === 2) return { glyph: "⛅", label: "partly cloudy" };
  if (code === 3) return { glyph: "☁", label: "overcast" };
  if (code === 45 || code === 48) return { glyph: "≡", label: "fog" };
  if (code === 51 || code === 53 || code === 55) return { glyph: "⋮", label: "drizzle" };
  if (code === 56 || code === 57) return { glyph: "⋮", label: "freezing drizzle" };
  if (code === 61) return { glyph: "☂", label: "light rain" };
  if (code === 63) return { glyph: "☂", label: "rain" };
  if (code === 65) return { glyph: "☔", label: "heavy rain" };
  if (code === 66 || code === 67) return { glyph: "☔", label: "freezing rain" };
  if (code === 71) return { glyph: "❄", label: "light snow" };
  if (code === 73) return { glyph: "❄", label: "snow" };
  if (code === 75) return { glyph: "❄", label: "heavy snow" };
  if (code === 77) return { glyph: "❄", label: "snow grains" };
  if (code === 80) return { glyph: "☂", label: "rain showers" };
  if (code === 81) return { glyph: "☂", label: "rain showers" };
  if (code === 82) return { glyph: "☔", label: "violent showers" };
  if (code === 85 || code === 86) return { glyph: "❄", label: "snow showers" };
  if (code === 95) return { glyph: "⚡", label: "thunderstorm" };
  if (code === 96 || code === 99) return { glyph: "⚡", label: "thunderstorm w/ hail" };
  return { glyph: "·", label: "unknown" };
}

function compass(deg: number) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}

function fmtHour(value: string) {
  // Open-Meteo returns "2026-05-06T15:00" in the requested timezone
  const date = new Date(`${value}:00`);
  if (Number.isNaN(date.getTime())) return value.slice(11, 16);
  const hours = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${String(hours).padStart(2, "0")}:${mins}`;
}

function fmtDay(value: string, idx: number) {
  if (idx === 0) return "Today";
  if (idx === 1) return "Tom";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}

function fmtClock(value: string) {
  const date = new Date(`${value}:00`);
  if (Number.isNaN(date.getTime())) return value.slice(11, 16);
  const hours = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${String(hours).padStart(2, "0")}:${mins}`;
}

function fmtRelative(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function loadStored(): { location: Location; unit: Unit } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { location?: Location; unit?: Unit };
    if (!parsed.location) return null;
    return {
      location: parsed.location,
      unit: parsed.unit === "metric" ? "metric" : "imperial",
    };
  } catch {
    return null;
  }
}

function persist(location: Location, unit: Unit) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ location, unit }));
  } catch {
    // ignore storage errors
  }
}

async function fetchForecast(location: Location, unit: Unit): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: "auto",
    temperature_unit: unit === "metric" ? "celsius" : "fahrenheit",
    wind_speed_unit: unit === "metric" ? "kmh" : "mph",
    precipitation_unit: unit === "metric" ? "mm" : "inch",
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day,precipitation",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day,uv_index",
    daily:
      "temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_probability_max,uv_index_max",
    forecast_days: "7",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error(`forecast request failed: ${response.status}`);
  return (await response.json()) as Forecast;
}

async function geocode(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ name: query, count: "5", language: "en", format: "json" });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) throw new Error(`geocoding failed: ${response.status}`);
  const data = (await response.json()) as { results?: GeocodeResult[] };
  return data.results ?? [];
}

async function reverseLabel(latitude: number, longitude: number): Promise<Location> {
  // Open-Meteo's geocoding has no reverse endpoint, so use a nearby search.
  // BigDataCloud offers a free no-key reverse geocode service for client use.
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const response = await fetch(url);
    if (response.ok) {
      const data = (await response.json()) as {
        city?: string;
        locality?: string;
        principalSubdivision?: string;
        countryName?: string;
      };
      const name = data.city || data.locality || "Current location";
      return {
        name,
        region: data.principalSubdivision ?? "",
        country: data.countryName ?? "",
        latitude,
        longitude,
      };
    }
  } catch {
    // fall through
  }
  return {
    name: "Current location",
    region: "",
    country: "",
    latitude,
    longitude,
  };
}

export default function WeatherPage() {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [unit, setUnit] = useState<Unit>("imperial");
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [locating, setLocating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setLocation(stored.location);
      setUnit(stored.unit);
      setHydrated(true);
      return;
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const next = await reverseLabel(position.coords.latitude, position.coords.longitude);
          setLocation(next);
          setHydrated(true);
        },
        () => setHydrated(true),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
      );
      return;
    }
    setHydrated(true);
  }, []);

  const refresh = useCallback(
    async (loc: Location, u: Unit) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchForecast(loc, u);
        setForecast(data);
        setUpdatedAt(new Date().toISOString());
        persist(loc, u);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "could not load forecast");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!hydrated) return;
    refresh(location, unit);
  }, [hydrated, location, unit, refresh]);

  const onSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    setSearchBusy(true);
    setSearchError(null);
    try {
      const results = await geocode(query);
      if (results.length === 0) {
        setSearchError("no matches");
        setSearchResults([]);
        return;
      }
      if (results.length === 1) {
        applyGeocode(results[0]);
        setSearch("");
        setSearchResults([]);
        return;
      }
      setSearchResults(results);
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "search failed");
    } finally {
      setSearchBusy(false);
    }
  };

  const applyGeocode = (result: GeocodeResult) => {
    setLocation({
      name: result.name,
      region: result.admin1 ?? "",
      country: result.country ?? "",
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    });
    setSearchResults([]);
    setSearch("");
    setSearchError(null);
  };

  const useGeolocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSearchError("geolocation unavailable");
      return;
    }
    setLocating(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const next = await reverseLabel(position.coords.latitude, position.coords.longitude);
        setLocation(next);
        setLocating(false);
      },
      (cause) => {
        setLocating(false);
        setSearchError(cause.message || "geolocation denied");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  };

  const tempUnit = forecast?.current_units.temperature_2m ?? (unit === "metric" ? "°C" : "°F");
  const windUnit = forecast?.current_units.wind_speed_10m ?? (unit === "metric" ? "km/h" : "mph");

  const today = forecast?.daily;
  const todayHigh = today ? Math.round(today.temperature_2m_max[0]) : null;
  const todayLow = today ? Math.round(today.temperature_2m_min[0]) : null;
  const todaySunrise = today ? today.sunrise[0] : null;
  const todaySunset = today ? today.sunset[0] : null;
  const todayPrecip = today ? today.precipitation_probability_max[0] : null;
  const todayUv = today ? Math.round(today.uv_index_max[0]) : null;

  const currentUv = useMemo(() => {
    if (!forecast) return null;
    const idx = forecast.hourly.time.findIndex((t) => new Date(`${t}:00`).getTime() >= Date.now());
    const target = idx <= 0 ? 0 : idx - 1;
    const value = forecast.hourly.uv_index[target];
    return typeof value === "number" ? Math.round(value) : null;
  }, [forecast]);

  const hourly = useMemo(() => {
    if (!forecast) return [];
    const nowIdx = forecast.hourly.time.findIndex((t) => new Date(`${t}:00`).getTime() >= Date.now());
    const start = Math.max(0, nowIdx);
    const indices: number[] = [];
    for (let i = start; i < forecast.hourly.time.length && indices.length < 12; i += 1) {
      indices.push(i);
    }
    return indices.map((i) => ({
      time: forecast.hourly.time[i],
      temp: Math.round(forecast.hourly.temperature_2m[i]),
      code: forecast.hourly.weather_code[i],
      pop: forecast.hourly.precipitation_probability[i],
      isDay: forecast.hourly.is_day[i] === 1,
      uv: typeof forecast.hourly.uv_index[i] === "number"
        ? Math.round(forecast.hourly.uv_index[i])
        : null,
    }));
  }, [forecast]);

  const days = useMemo(() => {
    if (!forecast) return [];
    return forecast.daily.time.map((iso, i) => ({
      iso,
      label: fmtDay(iso, i),
      high: Math.round(forecast.daily.temperature_2m_max[i]),
      low: Math.round(forecast.daily.temperature_2m_min[i]),
      code: forecast.daily.weather_code[i],
      pop: forecast.daily.precipitation_probability_max[i],
      uv: typeof forecast.daily.uv_index_max[i] === "number"
        ? Math.round(forecast.daily.uv_index_max[i])
        : null,
    }));
  }, [forecast]);

  const current = forecast?.current;
  const currentDesc = current ? describeCode(current.weather_code, current.is_day === 1) : null;

  return (
    <div className="weather-page">
      <header>
        <p className="page-name">
          <Link href="/" className="weather-crumb">
            Cade Ross
          </Link>
          <span> / Weather</span>
        </p>
        <p className="page-greeting">{location.name}</p>
      </header>

      <div className="weather-controls">
        <div className="weather-units" role="group" aria-label="Units">
          <button
            type="button"
            className="weather-toggle"
            data-active={unit === "imperial"}
            onClick={() => setUnit("imperial")}
          >
            °F
          </button>
          <span className="weather-toggle-sep">/</span>
          <button
            type="button"
            className="weather-toggle"
            data-active={unit === "metric"}
            onClick={() => setUnit("metric")}
          >
            °C
          </button>
        </div>
        <div className="weather-controls-meta">
          {updatedAt && (
            <span className="weather-muted">
              {loading ? "updating…" : fmtRelative(updatedAt)}
            </span>
          )}
          <button
            type="button"
            className="weather-link"
            onClick={() => refresh(location, unit)}
            disabled={loading}
            aria-label="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {current && currentDesc && (
        <section className="weather-block" aria-label="Now">
          <p className="weather-now">
            <span className="weather-now-temp">
              {Math.round(current.temperature_2m)}
              <span className="weather-now-unit">{tempUnit}</span>
            </span>
            <span className="weather-now-glyph">{currentDesc.glyph}</span>
            <span className="weather-now-label">{currentDesc.label}</span>
          </p>
          <p className="weather-line weather-muted-line">
            feels {Math.round(current.apparent_temperature)}
            {tempUnit} · humidity {current.relative_humidity_2m}% · wind{" "}
            {Math.round(current.wind_speed_10m)} {windUnit} {compass(current.wind_direction_10m)}
            {currentUv !== null && <> · UV {currentUv}</>}
          </p>
        </section>
      )}

      {today && todayHigh !== null && todayLow !== null && (
        <section className="weather-block" aria-label="Today">
          <p className="weather-line">
            <span className="weather-value">{todayHigh}{tempUnit}</span>
            <span className="weather-sep">/</span>
            <span className="weather-muted">{todayLow}{tempUnit}</span>
            <span className="weather-sep">·</span> precip{" "}
            <span className="weather-value">{todayPrecip ?? 0}%</span>
            {todayUv !== null && (
              <>
                <span className="weather-sep">·</span> UV max{" "}
                <span className="weather-value">{todayUv}</span>
              </>
            )}
          </p>
          <p className="weather-line weather-muted-line">
            ↑ {todaySunrise ? fmtClock(todaySunrise) : "—"} · ↓{" "}
            {todaySunset ? fmtClock(todaySunset) : "—"}
          </p>
        </section>
      )}

      {hourly.length > 0 && (
        <section className="weather-block" aria-label="Hourly forecast">
          <div className="weather-table" role="list">
            {hourly.map((row) => {
              const desc = describeCode(row.code, row.isDay);
              return (
                <p
                  className="weather-row"
                  role="listitem"
                  key={row.time}
                  title={desc.label}
                >
                  <span className="weather-col weather-col-time">{fmtHour(row.time)}</span>
                  <span className="weather-col weather-col-temp">
                    {row.temp}
                    {tempUnit}
                  </span>
                  <span className="weather-col weather-col-glyph">{desc.glyph}</span>
                  <span className="weather-col weather-col-uv weather-muted">
                    {row.uv === null ? "—" : `uv ${row.uv}`}
                  </span>
                  <span className="weather-col weather-col-pop weather-muted">{row.pop}%</span>
                </p>
              );
            })}
          </div>
        </section>
      )}

      {days.length > 0 && (
        <section className="weather-block" aria-label="Weekly forecast">
          <div className="weather-table" role="list">
            {days.map((day) => {
              const desc = describeCode(day.code, true);
              return (
                <p
                  className="weather-row"
                  role="listitem"
                  key={day.iso}
                  title={desc.label}
                >
                  <span className="weather-col weather-col-day">{day.label}</span>
                  <span className="weather-col weather-col-temp">
                    <span className="weather-value">{day.high}°</span>
                    <span className="weather-sep">/</span>
                    <span className="weather-muted">{day.low}°</span>
                  </span>
                  <span className="weather-col weather-col-glyph">{desc.glyph}</span>
                  <span className="weather-col weather-col-uv weather-muted">
                    {day.uv === null ? "—" : `uv ${day.uv}`}
                  </span>
                  <span className="weather-col weather-col-pop weather-muted">{day.pop}%</span>
                </p>
              );
            })}
          </div>
        </section>
      )}

      <section className="weather-block" aria-label="Search">
        <form className="weather-search" onSubmit={onSearchSubmit}>
          <p className="weather-line weather-search-line">
            <span className="weather-prompt">/</span>
            <input
              type="text"
              className="weather-input"
              placeholder="search a city…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                if (searchError) setSearchError(null);
              }}
              aria-label="Search city"
            />
            <button
              type="button"
              className="weather-link"
              onClick={useGeolocation}
              disabled={locating}
              title="Use my location"
            >
              {locating ? "…" : "⌖"}
            </button>
          </p>
          {searchError && <p className="weather-line weather-error">{searchError}</p>}
          {searchResults.length > 0 && (
            <div className="weather-search-results" role="listbox">
              {searchResults.map((result) => (
                <button
                  type="button"
                  className="weather-search-result"
                  key={`${result.latitude}-${result.longitude}-${result.name}`}
                  onClick={() => applyGeocode(result)}
                >
                  <span className="weather-search-name">{result.name}</span>
                  <span className="weather-search-region">
                    {[result.admin1, result.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>
      </section>

      <footer className="page-footer">
        <div className="footer-row">
          <p>data: open-meteo.com</p>
        </div>
      </footer>
    </div>
  );
}
