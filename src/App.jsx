import { useMemo, useState } from "react";
import "./App.css";

/**
 * Weather Now — live city weather with animated icons and backgrounds.
 *
 * Data: Open-Meteo (https://open-meteo.com) — free, no API key, CORS-enabled.
 *   1. Geocoding API -> city name to latitude/longitude
 *   2. Forecast API  -> current conditions + 5-day forecast
 *
 * No npm packages needed besides React. Styles live in WeatherApp.css.
 */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/* ------------------------------------------------------------------ */
/*  Weather code helpers                                              */
/* ------------------------------------------------------------------ */

// Reference: https://open-meteo.com/en/docs#weathervariables
const WEATHER_LABELS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

function describe(code) {
  return WEATHER_LABELS[code] || "Unknown";
}

// Collapse the many codes into a handful of visual "kinds"
function getKind(code) {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "cloudy";
}

// Picks the CSS theme class for the page background
function getTheme(code, isDay) {
  const kind = getKind(code);
  if (kind === "clear" || kind === "partly") return `${kind}-${isDay ? "day" : "night"}`;
  if (kind === "drizzle") return "rain";
  return kind;
}

/* ------------------------------------------------------------------ */
/*  Animated SVG icons (all inline, no dependencies)                  */
/* ------------------------------------------------------------------ */

const CLOUD_PATH = "M20 46h26a10 10 0 0 0 1.5-19.9A14 14 0 0 0 20.5 24 11 11 0 0 0 20 46z";

function Sun() {
  return (
    <g className="ico-sun">
      <g className="ico-rays">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="32" y1="6" x2="32" y2="13"
            transform={`rotate(${deg} 32 32)`}
            stroke="#FFD25E" strokeWidth="3" strokeLinecap="round"
          />
        ))}
      </g>
      <circle cx="32" cy="32" r="11" fill="#FFC93C" />
    </g>
  );
}

function Moon() {
  return (
    <g className="ico-moon">
      <path d="M42 11A21 21 0 1 0 53 41 17 17 0 0 1 42 11z" fill="#F4E7B2" />
      <circle className="ico-star" cx="50" cy="16" r="1.6" fill="#fff" />
      <circle className="ico-star ico-star-2" cx="55" cy="26" r="1.2" fill="#fff" />
    </g>
  );
}

function Cloud({ fill = "#E7EDF8", dark = false }) {
  return <path className="ico-cloud" d={CLOUD_PATH} fill={dark ? "#9AA6BF" : fill} />;
}

function WeatherIcon({ code, isDay = true, size = 64, className = "" }) {
  const kind = getKind(code);

  let content;
  switch (kind) {
    case "clear":
      content = isDay ? <Sun /> : <Moon />;
      break;
    case "partly":
      content = (
        <>
          <g transform="translate(-8 -8) scale(0.8)">{isDay ? <Sun /> : <Moon />}</g>
          <Cloud />
        </>
      );
      break;
    case "cloudy":
      content = (
        <>
          <g transform="translate(-6 -10) scale(0.85)">
            <Cloud dark />
          </g>
          <Cloud />
        </>
      );
      break;
    case "fog":
      content = (
        <>
          <Cloud />
          {[50, 55, 60].map((y, i) => (
            <line
              key={y}
              className={`ico-fog ico-fog-${i}`}
              x1="16" y1={y} x2="48" y2={y}
              stroke="#C9D3E6" strokeWidth="2.5" strokeLinecap="round"
            />
          ))}
        </>
      );
      break;
    case "drizzle":
    case "rain":
      content = (
        <>
          <Cloud dark />
          {(kind === "rain" ? [24, 32, 40] : [28, 38]).map((x, i) => (
            <line
              key={x}
              className={`ico-drop ico-drop-${i}`}
              x1={x} y1="50" x2={x - 3} y2="58"
              stroke="#6FB6FF" strokeWidth="3" strokeLinecap="round"
            />
          ))}
        </>
      );
      break;
    case "snow":
      content = (
        <>
          <Cloud />
          {[24, 32, 40].map((x, i) => (
            <circle key={x} className={`ico-flake ico-flake-${i}`} cx={x} cy="52" r="2.4" fill="#fff" />
          ))}
        </>
      );
      break;
    case "storm":
      content = (
        <>
          <Cloud dark />
          <polygon className="ico-bolt" points="34,40 27,54 33,54 30,64 41,49 35,49 38,40" fill="#FFD25E" />
        </>
      );
      break;
    default:
      content = <Cloud />;
  }

  return (
    <svg
      className={`wx-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={describe(code)}
    >
      {content}
    </svg>
  );
}

/* Small UI icons for the metric tiles */
const UiIcon = {
  humidity: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z" />
    </svg>
  ),
  wind: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7" />
    </svg>
  ),
  pressure: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l4-5" />
    </svg>
  ),
  rain: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 15a4 4 0 0 1-.6-7.9A5.5 5.5 0 0 1 17 8a3.5 3.5 0 0 1 0 7" />
      <path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Animated background particles                                     */
/* ------------------------------------------------------------------ */

// Deterministic "random" so particles don't jump around on every re-render
function pseudo(i, salt = 1) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Particles({ theme }) {
  const items = useMemo(() => {
    const make = (count, fn) => Array.from({ length: count }, (_, i) => fn(i));

    if (theme === "rain" || theme === "storm") {
      return {
        type: "rain",
        nodes: make(theme === "storm" ? 70 : 50, (i) => ({
          "--x": `${pseudo(i, 1) * 100}%`,
          "--len": `${14 + pseudo(i, 2) * 22}px`,
          "--dur": `${0.55 + pseudo(i, 3) * 0.5}s`,
          "--delay": `${-pseudo(i, 4) * 2}s`,
        })),
      };
    }
    if (theme === "snow") {
      return {
        type: "snow",
        nodes: make(45, (i) => ({
          "--x": `${pseudo(i, 1) * 100}%`,
          "--size": `${3 + pseudo(i, 2) * 6}px`,
          "--dur": `${6 + pseudo(i, 3) * 7}s`,
          "--delay": `${-pseudo(i, 4) * 10}s`,
          "--sway": `${(pseudo(i, 5) - 0.5) * 80}px`,
        })),
      };
    }
    if (theme.endsWith("night")) {
      return {
        type: "star",
        nodes: make(40, (i) => ({
          "--x": `${pseudo(i, 1) * 100}%`,
          "--y": `${pseudo(i, 2) * 70}%`,
          "--size": `${1 + pseudo(i, 3) * 2.2}px`,
          "--dur": `${2 + pseudo(i, 4) * 3}s`,
          "--delay": `${-pseudo(i, 5) * 4}s`,
        })),
      };
    }
    if (theme === "cloudy" || theme === "fog" || theme.startsWith("partly")) {
      return {
        type: "bgcloud",
        nodes: make(4, (i) => ({
          "--y": `${6 + i * 20}%`,
          "--scale": `${0.8 + pseudo(i, 2) * 0.9}`,
          "--dur": `${40 + pseudo(i, 3) * 30}s`,
          "--delay": `${-pseudo(i, 4) * 50}s`,
        })),
      };
    }
    return { type: "none", nodes: [] };
  }, [theme]);

  return (
    <div className="wx-particles" aria-hidden="true">
      {theme === "clear-day" && <div className="wx-sunglow" />}
      {theme === "storm" && <div className="wx-lightning" />}
      {items.nodes.map((style, i) => (
        <span key={i} className={`wx-p wx-p-${items.type}`} style={style} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

const toF = (c) => (c * 9) / 5 + 32;

export default function WeatherApp() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error | done
  const [errorMsg, setErrorMsg] = useState("");
  const [matches, setMatches] = useState(null);
  const [weather, setWeather] = useState(null); // { place, current, daily }
  const [unit, setUnit] = useState("C");

  const temp = (c) => `${Math.round(unit === "C" ? c : toF(c))}°`;

  const theme = weather
    ? getTheme(weather.current.weather_code, weather.current.is_day === 1)
    : "idle";

  async function handleSearch(e) {
    e.preventDefault();
    const city = query.trim();
    if (!city) return;

    setStatus("loading");
    setErrorMsg("");
    setMatches(null);

    try {
      const res = await fetch(
        `${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=5&language=en&format=json`
      );
      if (!res.ok) throw new Error("Location lookup failed. Please try again.");
      const data = await res.json();
      const results = data.results || [];

      if (results.length === 0) {
        setStatus("error");
        setErrorMsg(`No matches found for "${city}".`);
        return;
      }
      if (results.length === 1) {
        await loadWeather(results[0]);
      } else {
        setStatus("idle");
        setMatches(results);
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong.");
    }
  }

  async function loadWeather(place) {
    setStatus("loading");
    setErrorMsg("");
    setMatches(null);

    try {
      const params = new URLSearchParams({
        latitude: place.latitude,
        longitude: place.longitude,
        current:
          "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,surface_pressure,precipitation",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        forecast_days: "6",
        timezone: "auto",
      });
      const res = await fetch(`${FORECAST_URL}?${params}`);
      if (!res.ok) throw new Error("Weather lookup failed. Please try again.");
      const data = await res.json();

      setWeather({ place, current: data.current, daily: data.daily });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong.");
    }
  }

  return (
    <div className={`weather-page theme-${theme}`}>
      <Particles theme={theme} />

      <main className="wx-app">
        <header className="wx-header">
          <h1 className="wx-title">Weather Now</h1>
          <div className="wx-unit-toggle" role="group" aria-label="Temperature unit">
            {["C", "F"].map((u) => (
              <button
                key={u}
                type="button"
                className={unit === u ? "active" : ""}
                onClick={() => setUnit(u)}
              >
                °{u}
              </button>
            ))}
          </div>
        </header>

        <form className="wx-search" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city…"
            autoComplete="off"
            aria-label="City name"
          />
          <button type="submit" disabled={status === "loading"} aria-label="Search">
            {UiIcon.search}
            <span>Search</span>
          </button>
        </form>

        {status === "error" && <div className="wx-error">{errorMsg}</div>}

        {status === "loading" && (
          <div className="wx-loading">
            <span className="wx-spinner" />
            Fetching the latest weather…
          </div>
        )}

        {matches && (
          <div className="wx-matches">
            <div className="wx-matches-hint">Multiple matches — pick one:</div>
            {matches.map((place, i) => (
              <button
                key={place.id}
                className="wx-match"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => loadWeather(place)}
              >
                {UiIcon.pin}
                <span>
                  {place.name}
                  {place.admin1 ? `, ${place.admin1}` : ""}
                  {place.country ? `, ${place.country}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        {status === "idle" && !matches && !weather && (
          <div className="wx-empty">
            <WeatherIcon code={2} isDay size={110} />
            <p>Search for any city to see live conditions.</p>
          </div>
        )}

        {weather && status !== "loading" && (
          <>
            <section className="wx-card wx-main" key={weather.place.id}>
              <div className="wx-place">
                {UiIcon.pin}
                {weather.place.name}
                {weather.place.country ? `, ${weather.place.country}` : ""}
              </div>

              <div className="wx-hero">
                <WeatherIcon
                  code={weather.current.weather_code}
                  isDay={weather.current.is_day === 1}
                  size={120}
                  className="wx-hero-icon"
                />
                <div>
                  <div className="wx-temp">{temp(weather.current.temperature_2m)}</div>
                  <div className="wx-phrase">{describe(weather.current.weather_code)}</div>
                  <div className="wx-feels">
                    Feels like {temp(weather.current.apparent_temperature)}
                  </div>
                </div>
              </div>

              <div className="wx-metrics">
                <Metric icon={UiIcon.humidity} label="Humidity" value={`${weather.current.relative_humidity_2m}%`} />
                <Metric icon={UiIcon.wind} label="Wind" value={`${weather.current.wind_speed_10m} km/h`} />
                <Metric icon={UiIcon.pressure} label="Pressure" value={`${Math.round(weather.current.surface_pressure)} hPa`} />
                <Metric icon={UiIcon.rain} label="Precipitation" value={`${weather.current.precipitation} mm`} />
              </div>
            </section>

            <section className="wx-card wx-forecast">
              <h2>Next days</h2>
              <ul>
                {weather.daily.time.slice(1).map((date, i) => {
                  const idx = i + 1;
                  const day = new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: "short" });
                  return (
                    <li key={date} style={{ animationDelay: `${i * 70}ms` }}>
                      <span className="wx-day">{day}</span>
                      <WeatherIcon code={weather.daily.weather_code[idx]} isDay size={38} />
                      <span className="wx-range">
                        <strong>{temp(weather.daily.temperature_2m_max[idx])}</strong>
                        <span>{temp(weather.daily.temperature_2m_min[idx])}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <p className="wx-credit">Live data from Open-Meteo</p>
          </>
        )}
      </main>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="wx-metric">
      <span className="wx-metric-icon">{icon}</span>
      <div>
        <div className="wx-metric-label">{label}</div>
        <div className="wx-metric-value">{value}</div>
      </div>
    </div>
  );
}