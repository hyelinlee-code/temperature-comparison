import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { WeatherType } from "../lib/weather";
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, Moon } from "lucide-react";

interface WeatherVisualsProps {
  type: WeatherType;
  isDay: boolean;
}

export function WeatherVisuals({ type, isDay }: WeatherVisualsProps) {
  const [elements, setElements] = useState<number[]>([]);

  useEffect(() => {
    // Generate an array for raindrops/snowflakes
    if (type === 'rain' || type === 'snow' || type === 'thunder') {
      setElements(Array.from({ length: 30 }).map((_, i) => i));
    } else if (type === 'cloudy') {
      setElements(Array.from({ length: 5 }).map((_, i) => i));
    } else {
      setElements([]);
    }
  }, [type]);

  const bgGradients = {
    clear: isDay ? "from-cyan-400 via-blue-400 to-blue-500" : "from-slate-900 via-indigo-950 to-blue-950",
    cloudy: isDay ? "from-gray-300 via-slate-300 to-gray-400" : "from-slate-800 via-gray-800 to-slate-900",
    rain: isDay ? "from-slate-500 via-gray-600 to-slate-800" : "from-gray-800 via-slate-900 to-black",
    snow: isDay ? "from-slate-200 via-blue-200 to-blue-300" : "from-slate-700 via-slate-800 to-blue-950",
    thunder: isDay ? "from-slate-700 via-gray-800 to-slate-900" : "from-gray-900 via-slate-950 to-black"
  };

  return (
    <div className={`fixed inset-0 z-0 bg-gradient-to-b ${bgGradients[type]} transition-colors duration-1000 overflow-hidden`}>
      {/* Thunder Flash */}
      {type === 'thunder' && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0.8, 0, 0, 0, 0.3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: Math.random() * 2 }}
        />
      )}

      {/* Sun or Moon */}
      {type === 'clear' && (
        <motion.div
          className="absolute right-[-10%] sm:right-[5%] md:right-[10%] lg:right-[15%] top-[-5%] sm:top-[2%] md:top-[5%] opacity-80"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {isDay ? (
            <Sun size={240} className="text-yellow-300 drop-shadow-[0_0_40px_rgba(253,224,71,0.6)]" strokeWidth={1} />
          ) : (
             <Moon size={240} className="text-blue-100 drop-shadow-[0_0_40px_rgba(219,234,254,0.6)]" strokeWidth={1} />
          )}
        </motion.div>
      )}

      {/* Clouds */}
      {(type === 'cloudy' || type === 'rain' || type === 'thunder' || type === 'snow') && elements.slice(0, 5).map((i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute opacity-60 flex gap-4"
          initial={{ x: "-50vw", y: 50 + Math.random() * 150 }}
          animate={{ x: "150vw" }}
          transition={{
            duration: 20 + Math.random() * 30,
            repeat: Infinity,
            ease: "linear",
            delay: -20 * Math.random(),
          }}
          style={{ top: `${Math.random() * 30}%` }}
        >
          <Cloud size={100 + Math.random() * 100} className={isDay ? "text-white" : "text-gray-500"} fill="currentColor" stroke="none" />
        </motion.div>
      ))}

      {/* Rain / Snow */}
      {(type === 'rain' || type === 'thunder' || type === 'snow') && elements.map((i) => {
        const isSnow = type === 'snow';
        const startX = Math.random() * 100;
        return (
          <motion.div
            key={`drop-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${startX}vw`,
              top: "-5vh",
              width: isSnow ? 10 + Math.random() * 8 : 2 + Math.random() * 2,
              height: isSnow ? 10 + Math.random() * 8 : 20 + Math.random() * 30,
              backgroundColor: isSnow ? "white" : "rgba(100, 150, 255, 0.5)",
              opacity: isSnow ? 0.8 : 0.6,
              filter: isSnow ? "blur(1px)" : "none",
            }}
            animate={{
              y: "110vh",
              x: isSnow ? `calc(${startX}vw + ${Math.random() * 20 - 10}vw)` : `${startX}vw`,
              rotate: isSnow ? 360 : 15,
            }}
            transition={{
              y: { duration: isSnow ? 3 + Math.random() * 4 : 0.8 + Math.random() * 0.5, repeat: Infinity, ease: "linear", delay: Math.random() * 2 },
              x: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 },
              rotate: { duration: 4, repeat: Infinity, ease: "linear" }
            }}
          />
        );
      })}
    </div>
  );
}
