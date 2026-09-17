import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Calculator, ChevronRight, ConciergeBell, Dumbbell, HeartPulse,
  Layers3, LocateFixed, MapPin, Navigation, PawPrint, Route, Search,
  UtensilsCrossed, X,
} from "lucide-react";

const STORAGE_KEY = "pathfinder-campus-map-preferences-v2";
const ENTRANCE = { x: 12, y: 52, label: "Main entrance · Golden Smithies Lane" };

const HOTSPOTS = [
  {
    id: "health", label: "Health Department", short: "Health", category: "practical",
    detail: "Clinical simulation wards and T Level Health training facilities.",
    directory: ["Clinical Suite A · Beds A1–A3", "Clinical Suite B · Beds B1–B4", "Pathfinder AI learning suite", "Clinical skills and assessment area"],
    rooms: ["Suite A", "Suite B", "H101", "H102"], x: 62, y: 69, scale: 1.75,
    icon: HeartPulse, colour: "from-pink-500 to-rose-600", action: "/ward-simulation",
  },
  {
    id: "reception", label: "Reception & Student Services", short: "Reception", category: "support",
    detail: "Main reception, visitor check-in and student support services.",
    directory: ["Main reception", "Student support", "Safeguarding team", "Campus enquiries"],
    rooms: ["Reception", "Student Services"], x: 52.5, y: 52, scale: 1.8,
    icon: ConciergeBell, colour: "from-sky-500 to-indigo-700",
  },
  {
    id: "animal-care", label: "Animal Care & Management", short: "Animal Care", category: "practical",
    detail: "Animal care teaching rooms and practical facilities.",
    directory: ["Practical animal care rooms", "Teaching classrooms", "Equipment store"],
    rooms: ["AC1", "AC2"], x: 45, y: 63, scale: 1.7,
    icon: PawPrint, colour: "from-emerald-500 to-green-700",
  },
  {
    id: "refectory", label: "Refectory", short: "Food & drink", category: "food",
    detail: "Campus dining, refreshments and social space.",
    directory: ["Hot food counter", "Grab-and-go", "Seating area", "Water refill point"],
    rooms: ["Refectory"], x: 73, y: 45, scale: 1.8,
    icon: UtensilsCrossed, colour: "from-orange-400 to-amber-600",
  },
  {
    id: "sport", label: "Sport Department", short: "Sport", category: "practical",
    detail: "Sport teaching, fitness and practical training facilities.",
    directory: ["Sports hall", "Fitness suite", "Teaching rooms", "Changing facilities"],
    rooms: ["Sports Hall", "S201"], x: 40, y: 77, scale: 1.65,
    icon: Dumbbell, colour: "from-blue-500 to-cyan-700",
  },
  {
    id: "english-maths", label: "English & Mathematics", short: "English & Maths", category: "teaching",
    detail: "English and mathematics classrooms and learning support.",
    directory: ["English classrooms", "Mathematics classrooms", "Study support"],
    rooms: ["EM1", "EM2", "M101"], x: 60.5, y: 41, scale: 1.75,
    icon: Calculator, colour: "from-cyan-500 to-blue-700",
  },
  {
    id: "library", label: "Library & Learning Resource Centre", short: "Library", category: "support",
    detail: "Quiet study, computers, books and learning resources.",
    directory: ["Library help desk", "Quiet study", "Computer access", "Learning resources"],
    rooms: ["Library", "LRC"], x: 47, y: 55.5, scale: 1.8,
    icon: Building2, colour: "from-violet-500 to-purple-700",
  },
];

const FILTERS = [
  ["all", "All"],
  ["practical", "Practical"],
  ["teaching", "Teaching"],
  ["support", "Support"],
  ["food", "Food & drink"],
];

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function CampusZoomMap({ activeZone = "all", onZoneChange }) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const prefs = useMemo(loadPrefs, []);
  const [filter, setFilter] = useState(prefs.filter || "all");
  const [selectedId, setSelectedId] = useState(null);
  const [routeToId, setRouteToId] = useState(null);
  const [roomQuery, setRoomQuery] = useState("");
  const [locationState, setLocationState] = useState("off");
  const [showDirectory, setShowDirectory] = useState(false);

  const selected = HOTSPOTS.find((spot) => spot.id === selectedId) || null;
  const routeTarget = HOTSPOTS.find((spot) => spot.id === routeToId) || null;
  const visible = filter === "all" ? HOTSPOTS : HOTSPOTS.filter((spot) => spot.category === filter);

  useEffect(() => {
    if (activeZone === "all") return;
    const target = HOTSPOTS.find((spot) => spot.id === activeZone || spot.rooms.some((room) => room.toLowerCase() === activeZone.toLowerCase()));
    if (target) {
      setSelectedId(target.id);
      setFilter("all");
    }
  }, [activeZone]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ filter })); } catch {}
  }, [filter]);

  const choose = (spot) => {
    setSelectedId(spot.id);
    setShowDirectory(false);
    onZoneChange?.(spot.id);
  };

  const findRoom = () => {
    const value = roomQuery.trim().toLowerCase();
    if (!value) return;
    const target = HOTSPOTS.find((spot) =>
      spot.rooms.some((room) => room.toLowerCase() === value) ||
      spot.label.toLowerCase().includes(value),
    );
    if (target) {
      choose(target);
      setRouteToId(target.id);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState("unsupported");
      return;
    }
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      () => setLocationState("ready"),
      () => setLocationState("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  const reset = () => {
    setSelectedId(null);
    setRouteToId(null);
    setShowDirectory(false);
    setFilter("all");
    onZoneChange?.("all");
  };

  const mapStyle = selected
    ? { transformOrigin: `${selected.x}% ${selected.y}%`, transform: `scale(${selected.scale})` }
    : { transformOrigin: "50% 50%", transform: "scale(1)" };

  return (
    <div className="campus-map-shell relative mx-auto w-full max-w-[860px]">
      <div className="campus-wayfinding-toolbar" aria-label="Campus map controls">
        <div className="campus-layer-row" role="group" aria-label="Map layers">
          <Layers3 className="h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
          {FILTERS.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value}
              onClick={() => { setFilter(value); setSelectedId(null); }}
              className={filter === value ? "is-active" : ""}>{label}</button>
          ))}
        </div>
        <div className="campus-room-search">
          <label htmlFor="campus-room-search" className="sr-only">Find a timetable room</label>
          <Search className="h-4 w-4" aria-hidden="true" />
          <input id="campus-room-search" value={roomQuery} onChange={(event) => setRoomQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && findRoom()}
            placeholder="Find timetable room…" />
          <button type="button" onClick={findRoom}>Show</button>
        </div>
        <button type="button" onClick={requestLocation} className={locationState === "ready" ? "campus-location is-active" : "campus-location"}>
          <LocateFixed className="h-4 w-4" /> {locationState === "loading" ? "Locating…" : "You are here"}
        </button>
      </div>

      <div ref={mapRef} className="campus-interactive-map relative aspect-square w-full overflow-hidden bg-slate-100">
        <div className="campus-map-world absolute inset-0" style={mapStyle}>
          <picture>
            <source srcSet="/assets/campus-map-optimised.webp" type="image/webp" />
            <img src="/assets/campus-original-map.png" alt="Interactive map of Dearne Valley College"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          </picture>

          {routeTarget && (
            <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={`${ENTRANCE.x},${ENTRANCE.y} 24,${ENTRANCE.y} 35,60 ${routeTarget.x},${routeTarget.y}`}
                fill="none" stroke="#0759b6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="2.2 1.4" className="campus-route-line" />
            </svg>
          )}

          <span className="campus-entrance-label" style={{ left: `${ENTRANCE.x}%`, top: `${ENTRANCE.y}%` }}>
            <Navigation className="h-3.5 w-3.5" /> Entrance
          </span>

          {locationState === "ready" && (
            <span className="campus-you-are-here" style={{ left: "15%", top: "53%" }} aria-label="Approximate current location near the main entrance">
              <span /> <b>You</b>
            </span>
          )}

          {HOTSPOTS.map((spot) => {
            const Icon = spot.icon;
            const isVisible = visible.some((item) => item.id === spot.id);
            const isSelected = selectedId === spot.id;
            return (
              <button key={spot.id} type="button" onClick={() => choose(spot)}
                style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%, -50%)" }}
                className={`campus-hotspot group absolute z-30 grid h-12 w-12 place-items-center ${isVisible ? "opacity-100" : "pointer-events-none opacity-15 grayscale"}`}
                aria-label={`Open ${spot.label} details`} aria-pressed={isSelected}>
                <span style={{ transform: selected ? `scale(${1 / selected.scale})` : "scale(1)" }}
                  className={`relative grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-gradient-to-br ${spot.colour} text-white shadow-lg transition group-hover:scale-110 group-focus:scale-110 ${isSelected ? "ring-4 ring-white/70" : ""}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {(locationState === "denied" || locationState === "unsupported") && (
        <p className="campus-location-message" role="status">
          {locationState === "denied" ? "Location access was not granted. You can still use room search and routes." : "Location services are unavailable on this device."}
        </p>
      )}
      {locationState === "ready" && <p className="campus-location-message">Blue-dot positioning is approximate outdoors; use campus signs for final indoor directions.</p>}

      <div className="campus-destination-panel" aria-live="polite">
        {selected ? (
          <>
            <div className="campus-destination-heading">
              <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${selected.colour} text-white`}><selected.icon className="h-5 w-5" /></span>
              <div><p>Destination</p><h3>{selected.label}</h3><span>{selected.detail}</span></div>
              <button type="button" onClick={reset} aria-label="Close destination details"><X className="h-5 w-5" /></button>
            </div>
            <div className="campus-destination-actions">
              <button type="button" onClick={() => setRouteToId(selected.id)}><Route className="h-4 w-4" /> Route from entrance</button>
              <button type="button" onClick={() => setShowDirectory((value) => !value)}><Building2 className="h-4 w-4" /> Directory</button>
              {selected.action && <button type="button" onClick={() => navigate(selected.action)} className="is-primary">Open virtual facility <ChevronRight className="h-4 w-4" /></button>}
            </div>
            {showDirectory && (
              <div className="campus-directory">
                <h4>Inside {selected.short}</h4>
                <ul>{selected.directory.map((item) => <li key={item}><MapPin className="h-3.5 w-3.5" />{item}</li>)}</ul>
                <p>Timetable references: {selected.rooms.join(", ")}</p>
              </div>
            )}
          </>
        ) : (
          <div className="campus-empty-state">
            <MapPin className="h-6 w-6 text-sky-700" />
            <div><h3>Explore the campus</h3><p>Tap a coloured icon, filter facilities, or enter a room from your timetable.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CampusZoomMap);
