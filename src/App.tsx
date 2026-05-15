import { useEffect, useState } from "react";
import { fetchWeather, reverseGeocode, WeatherData, getWeatherType, formatTemp } from "./lib/weather";
import { WeatherVisuals } from "./components/WeatherVisuals";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Thermometer, ThermometerSun, ThermometerSnowflake, Settings, RefreshCcw, Linkedin, Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from "lucide-react";

function AnimatedTemp({ temp, unit, showUnit = false, showDegree = true }: { temp: number, unit: 'C' | 'F', showUnit?: boolean, showDegree?: boolean }) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;
    const duration = 800;
    const targetValue = unit === 'C' ? temp : (temp * 9) / 5 + 32;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      // easeOutCubic
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      
      setCurrentValue(targetValue * easeOut);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [temp, unit]);

  return <>{Math.round(currentValue)}{showDegree && '°'}{showUnit && unit}</>;
}

function WeatherConditionRow({ code, isDay }: { code: number, isDay: boolean }) {
  const type = getWeatherType(code);
  let Icon = Sun;
  let label = "CLEAR";
  
  if (type === 'cloudy') { Icon = Cloud; label = "CLOUDY"; }
  else if (type === 'rain') { Icon = CloudRain; label = "RAINY"; }
  else if (type === 'snow') { Icon = CloudSnow; label = "SNOWY"; }
  else if (type === 'thunder') { Icon = CloudLightning; label = "STORMY"; }

  return (
    <div className={`flex items-center justify-center gap-2 mt-4 font-bold text-sm sm:text-base drop-shadow-sm uppercase tracking-wide ${isDay ? "text-slate-500" : "text-blue-100"}`}>
      <Icon size={18} strokeWidth={2.5} />
      <span>{label}</span>
    </div>
  );
}

function WeatherCard({
  title,
  temp,
  maxTemp,
  minTemp,
  weatherCode,
  date,
  isDay,
  unit
}: {
  title: string;
  temp: number;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  date: Date;
  isDay: boolean;
  unit: 'C' | 'F';
}) {
  const cardClasses = `w-full xl:flex-1 h-full ${
    isDay 
      ? "bg-white/60 border-white shadow-xl" 
      : "bg-slate-800/60 border-slate-600 shadow-xl"
  } backdrop-blur-md rounded-[40px] sm:rounded-[48px] border-4 flex flex-col items-center justify-between p-6 sm:p-8 xl:py-6 xl:px-8 sm:min-h-[380px] xl:min-h-0 relative overflow-hidden z-20 group`;

  const labelClasses = `uppercase font-black ${isDay ? "text-slate-500" : "text-blue-200/80"} tracking-widest text-xs sm:text-sm drop-shadow-sm line-clamp-1`;
  const bigTempClasses = `text-[100px] sm:text-[120px] xl:text-[130px] font-black leading-none ${isDay ? "text-slate-900" : "text-white"} tracking-tighter drop-shadow-sm`;
  const hlRowClasses = `${isDay ? "text-slate-500" : "text-blue-100"} font-bold text-sm sm:text-base flex items-center justify-center drop-shadow-sm whitespace-nowrap`;
  
  const pillWrapperClasses = `px-4 sm:px-6 py-2 ${isDay ? "bg-slate-200/60" : "bg-white/20"} rounded-full inline-block backdrop-blur-md`;
  const pillTextClasses = `font-bold uppercase tracking-widest ${isDay ? "text-slate-600" : "text-white"} text-[10px] sm:text-xs drop-shadow-sm whitespace-nowrap`;

  return (
    <section className={cardClasses}>
      <div className="w-full text-left z-10 shrink-0 h-6">
        <span className={labelClasses}>{title}</span>
      </div>
      <div className="text-center flex-1 flex flex-col items-center justify-center relative z-10 w-full py-4 sm:py-0 xl:py-4">
        <p className={bigTempClasses}>
          <AnimatedTemp temp={temp} unit={unit} showUnit={false} />
        </p>
        <div className="flex gap-2 sm:gap-4 justify-center mt-3 shrink-0">
          <span className={hlRowClasses}><ThermometerSun size={16} className="mr-1" /> H: <AnimatedTemp temp={maxTemp} unit={unit} showUnit={true} /></span>
          <span className={hlRowClasses}><ThermometerSnowflake size={16} className="mr-1" /> L: <AnimatedTemp temp={minTemp} unit={unit} showUnit={true} /></span>
        </div>
        <div className="shrink-0">
          <WeatherConditionRow code={weatherCode} isDay={isDay} />
        </div>
      </div>
      <div className="w-full flex flex-col items-center justify-end z-10 shrink-0 h-10">
        <div className={pillWrapperClasses}>
          <p className={pillTextClasses}>
            {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState("Locating...");
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      const name = await reverseGeocode(lat, lon);
      setLocationName(name);

      const weatherData = await fetchWeather(lat, lon);
      setData(weatherData);
    } catch (err: any) {
      setError(err.message || "Failed to load weather");
    } finally {
      setLoading(false);
    }
  };

  const initGeolocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      // Default to London if not supported
      loadWeather(51.5074, -0.1278);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadWeather(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        console.error(err);
        // Default to London if denied or error
        loadWeather(51.5074, -0.1278);
      }
    );
  };

  useEffect(() => {
    initGeolocation();
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <RefreshCcw size={48} />
        </motion.div>
      </div>
    );
  }

  const weatherType = data ? getWeatherType(data.current.weatherCode) : 'clear';
  const isDay = data ? data.current.isDay === 1 : true;

  // Analysis for clothing suggestion
  let analysisText = "";

  if (data) {
    const tempDiff = data.today.sameHourTemp - data.yesterday.sameHourTemp;
    
    if (tempDiff > 3) {
      analysisText = "Consider ditching a layer. It's noticeably warmer today.";
    } else if (tempDiff < -3) {
      analysisText = "Grab an extra layer or a thicker jacket. It's chillier today.";
    } else if (data.today.sameHourTemp > 25) {
      analysisText = "Still shorts and t-shirt weather. Stay cool!";
    } else if (data.today.sameHourTemp < 10) {
      analysisText = "Keep the coat on, it's still freezing outside.";
    } else {
      analysisText = "Wear whatever you wore yesterday, the temperature is roughly the same.";
    }
  }
  return (
    <div className="relative flex flex-col justify-between min-h-[100dvh] md:h-[100dvh] overflow-x-hidden md:overflow-hidden font-sans text-slate-900 ds-app bg-slate-100">
      {/* Background Visuals */}
      <WeatherVisuals type={weatherType} isDay={isDay} />

      {/* Header */}
      <nav className="flex flex-col sm:flex-row justify-between items-center px-6 sm:px-12 py-4 xl:py-6 z-10 w-full gap-4 sm:gap-0 shrink-0">
        <div className="flex flex-col text-center sm:text-left">
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tighter uppercase italic ${isDay ? "text-slate-900" : "text-white"}`}>{locationName}</h1>
          <p className={`font-bold opacity-70 ${isDay ? "text-slate-800" : "text-slate-300"}`}>The Only Comparison That Matters</p>
        </div>
        <div className={`flex items-center gap-2 sm:gap-4 backdrop-blur-md p-2 rounded-2xl border-2 ${isDay ? "bg-white/30 border-white/40" : "bg-black/30 border-white/10"}`}>
          <button
            onClick={() => setUnit('C')}
            className={`px-4 sm:px-6 py-2 rounded-xl font-bold transition-colors ${unit === 'C' ? (isDay ? 'bg-slate-900 text-white shadow-lg shadow-black/20' : 'bg-white text-slate-900 shadow-lg shadow-black/20') : (isDay ? 'text-slate-900 hover:bg-white/40' : 'text-white hover:bg-white/20')}`}
          >
            °C
          </button>
          <button
            onClick={() => setUnit('F')}
            className={`px-4 sm:px-6 py-2 rounded-xl font-bold transition-colors ${unit === 'F' ? (isDay ? 'bg-slate-900 text-white shadow-lg shadow-black/20' : 'bg-white text-slate-900 shadow-lg shadow-black/20') : (isDay ? 'text-slate-900 hover:bg-white/40' : 'text-white hover:bg-white/20')}`}
          >
            °F
          </button>
          <button
            onClick={initGeolocation}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-colors ${isDay ? 'hover:bg-white/40 text-slate-900' : 'hover:bg-white/20 text-white'}`}
            title="Refresh Location"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </nav>

      {error ? (
        <div className="bg-red-500/80 text-white p-6 rounded-2xl backdrop-blur-md shadow-xl text-center m-8 z-10">
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
          <p>{error}</p>
        </div>
      ) : data ? (
        <>
          <main className="flex flex-col xl:flex-row px-4 sm:px-8 py-4 xl:py-8 gap-6 sm:gap-8 w-full max-w-5xl mx-auto items-center xl:items-stretch justify-center z-10 min-h-0 flex-1 relative">
            <WeatherCard
              title="Yesterday"
              temp={data.yesterday.sameHourTemp}
              maxTemp={data.yesterday.maxTemp}
              minTemp={data.yesterday.minTemp}
              weatherCode={data.yesterday.weatherCode}
              date={(() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return d;
              })()}
              isDay={isDay}
              unit={unit}
            />

            {/* Separator 1 */}
            <div className="flex items-center justify-center py-2 xl:py-0 shrink-0 z-20">
              <div className={`h-12 w-12 sm:h-16 sm:w-16 ${isDay ? "bg-white/80 border-slate-300" : "bg-slate-800/80 border-slate-600"} backdrop-blur rounded-full flex items-center justify-center shadow-xl border-4 transform rotate-90 xl:rotate-0`}>
                <svg className={`w-6 h-6 sm:w-8 sm:h-8 ${isDay ? "text-slate-700" : "text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>

            <WeatherCard
              title="Today"
              temp={data.today.sameHourTemp}
              maxTemp={data.today.maxTemp}
              minTemp={data.today.minTemp}
              weatherCode={data.today.weatherCode}
              date={new Date()}
              isDay={isDay}
              unit={unit}
            />
          </main>

          {/* Footer Recommendation Bar */}
          <footer className="bg-slate-900 text-white p-4 sm:p-6 flex flex-col items-center justify-center z-20 relative w-full shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full max-w-5xl mx-auto justify-between text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 flex-1 min-w-0">
                <div className="bg-orange-500 p-3 sm:p-4 rounded-2xl rotate-3 shrink-0 hidden sm:block">
                  <Thermometer size={28} className="text-white drop-shadow" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <p className="text-lg sm:text-2xl lg:text-3xl font-black leading-tight uppercase truncate">
                    Verdict: {Math.abs(data.today.sameHourTemp - data.yesterday.sameHourTemp) < 1 ? "Basically the same" : data.today.sameHourTemp > data.yesterday.sameHourTemp ? "Warmer" : "Colder"}
                  </p>
                  <p className="text-slate-400 font-bold uppercase tracking-wide text-sm sm:text-base mt-1 whitespace-normal sm:truncate text-ellipsis">{analysisText}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center sm:justify-end gap-3 text-white/60 text-xs sm:text-sm mt-3 sm:mt-0 shrink-0">
                <span>Built by Hyelin Lee</span>
                <a href="https://www.linkedin.com/in/hyelinlee09/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn Profile">
                  <Linkedin size={16} />
                </a>
                <a href="https://x.com/HyelinLeeHere" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="X (Twitter) Profile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                </a>
              </div>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  );
}

