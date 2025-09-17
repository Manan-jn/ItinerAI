'use client';

import { useState, useEffect, useRef } from 'react';

// Hardcoded weather data for now
const weatherData = {
  temperature: '8°C',
  location: 'New York, USA',
  condition: '⛅',
  sunriseTime: '6:14 am',
  sunsetTime: '5:56 pm',
  dayLength: '11 h 42 m',
  precipitationChance: 'Rain 85%',
  humidity: 'Humidity: 68%',
  windSpeed: 'Wind: 12 km/h',
  forecast: [
    { day: 'Today', icon: '⛅', high: '8°', low: '2°' },
    { day: 'Fri', icon: '🌧️', high: '7°', low: '1°' },
    { day: 'Sat', icon: '🌧️', high: '6°', low: '0°' },
    { day: 'Sun', icon: '☀️', high: '9°', low: '2°' }
  ]
};

export default function WeatherWidget() {
  const [currentTime, setCurrentTime] = useState('');
  const cloudContainerRef = useRef<HTMLDivElement>(null);

  // Update time every minute
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const optionsDate = { weekday: 'long' as const };
      const optionsTime = { hour: '2-digit' as const, minute: '2-digit' as const, hour12: false as const };
      setCurrentTime(
        `${now.toLocaleDateString(undefined, optionsDate)}, ${now.toLocaleTimeString([], optionsTime)}`
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initialize 3D clouds when component mounts
  useEffect(() => {
    const initializeClouds = async () => {
      if (!cloudContainerRef.current) return;

      try {
        // Dynamically import Three.js to avoid SSR issues
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

        const container = cloudContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        
        if (containerRect.width === 0 || containerRect.height === 0) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, containerRect.width / containerRect.height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setSize(containerRect.width, containerRect.height);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        camera.position.set(0, 0.5, 4.5);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(2, 3, 2);
        scene.add(directionalLight);
        const pointLight = new THREE.PointLight(0xaabbee, 0.8, 15);
        pointLight.position.set(-1, 1, 3);
        scene.add(pointLight);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.rotateSpeed = 0.8;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.minPolarAngle = Math.PI / 3;
        controls.maxPolarAngle = Math.PI / 1.8;
        controls.target.set(0, 0, 0);

        // Cloud group
        const cloudGroup = new THREE.Group();
        scene.add(cloudGroup);

        const cloudMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xf0f8ff,
          transparent: true,
          opacity: 0.85,
          roughness: 0.6,
          metalness: 0.0,
          transmission: 0.1,
          ior: 1.3,
          specularIntensity: 0.2,
          sheen: 0.2,
          sheenColor: 0xffffff,
          sheenRoughness: 0.5,
          clearcoat: 0.05,
          clearcoatRoughness: 0.3,
        });

        const createCloudPart = (radius: number, position: THREE.Vector3) => {
          const geometry = new THREE.SphereGeometry(radius, 20, 20);
          const mesh = new THREE.Mesh(geometry, cloudMaterial);
          mesh.position.copy(position);
          return mesh;
        };

        const createDetailedCloud = (x: number, y: number, z: number, scale: number) => {
          const singleCloudGroup = new THREE.Group();
          singleCloudGroup.position.set(x, y, z);
          singleCloudGroup.scale.set(scale, scale, scale);
          
          const parts = [
            { radius: 0.8, position: new THREE.Vector3(0, 0, 0) },
            { radius: 0.6, position: new THREE.Vector3(0.7, 0.2, 0.1) },
            { radius: 0.55, position: new THREE.Vector3(-0.6, 0.1, -0.2) },
            { radius: 0.7, position: new THREE.Vector3(0.1, 0.4, -0.3) },
            { radius: 0.5, position: new THREE.Vector3(0.3, -0.3, 0.2) },
            { radius: 0.6, position: new THREE.Vector3(-0.4, -0.2, 0.3) },
            { radius: 0.45, position: new THREE.Vector3(0.8, -0.1, -0.2) },
            { radius: 0.5, position: new THREE.Vector3(-0.7, 0.3, 0.3) },
          ];
          
          parts.forEach((part) =>
            singleCloudGroup.add(createCloudPart(part.radius, part.position))
          );
          
          (singleCloudGroup as any).userData = {
            isRaining: false,
            rainColor: Math.random() > 0.5 ? 0x87cefa : 0xb0e0e6,
            originalPosition: singleCloudGroup.position.clone(),
            bobOffset: Math.random() * Math.PI * 2,
            bobSpeed: 0.0005 + Math.random() * 0.0003,
            bobAmount: 0.15 + Math.random() * 0.1,
          };
          
          return singleCloudGroup;
        };

        const cloud1 = createDetailedCloud(-0.7, 0.2, 0, 1.0);
        const cloud2 = createDetailedCloud(0.7, -0.1, 0.3, 0.9);
        cloudGroup.add(cloud1, cloud2);
        cloudGroup.position.y = -0.2;
        let autoRotateSpeed = 0.002;

        // Rain functionality
        const createRaindropsForCloud = (cloud: THREE.Group) => {
          const rainGroup = new THREE.Group();
          cloud.add(rainGroup);
          (cloud.userData as any).rainGroup = rainGroup;
          
          const raindropMaterial = new THREE.MeshBasicMaterial({
            color: (cloud.userData as any).rainColor,
            transparent: true,
            opacity: 0.7,
          });
          
          const localRaindrops = [];
          for (let i = 0; i < 30; i++) {
            const raindropGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6);
            const raindrop = new THREE.Mesh(raindropGeom, raindropMaterial);
            raindrop.position.set(
              (Math.random() - 0.5) * 1.8,
              -0.8 - Math.random() * 1.5,
              (Math.random() - 0.5) * 1.8
            );
            (raindrop as any).userData = {
              originalY: raindrop.position.y - Math.random() * 0.5,
              speed: 0.08 + Math.random() * 0.05,
            };
            localRaindrops.push(raindrop);
            rainGroup.add(raindrop);
          }
          rainGroup.visible = false;
          return localRaindrops;
        };

        const raindrops1 = createRaindropsForCloud(cloud1);
        const raindrops2 = createRaindropsForCloud(cloud2);

        // Click interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (event: MouseEvent) => {
          const rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(cloudGroup.children, true);

          if (intersects.length > 0) {
            let clickedObj = intersects[0].object;
            let physicallyClickedCloud: THREE.Object3D | null = null;
            
            while (clickedObj.parent && clickedObj.parent !== cloudGroup) {
              clickedObj = clickedObj.parent as THREE.Object3D;
            }

            if (clickedObj.parent === cloudGroup) {
              physicallyClickedCloud = clickedObj;

              const isCloud1Raining = (cloud1.userData as any).isRaining;
              const isCloud2Raining = (cloud2.userData as any).isRaining;

              const newGlobalRainState = !(isCloud1Raining && isCloud2Raining);

              (cloud1.userData as any).isRaining = newGlobalRainState;
              if ((cloud1.userData as any).rainGroup) {
                (cloud1.userData as any).rainGroup.visible = newGlobalRainState;
              }

              (cloud2.userData as any).isRaining = newGlobalRainState;
              if ((cloud2.userData as any).rainGroup) {
                (cloud2.userData as any).rainGroup.visible = newGlobalRainState;
              }

              if (physicallyClickedCloud) {
                const originalScale = (physicallyClickedCloud as THREE.Group).scale.clone();
                (physicallyClickedCloud as THREE.Group).scale.multiplyScalar(1.15);
                setTimeout(() => {
                  (physicallyClickedCloud as THREE.Group).scale.copy(originalScale);
                }, 150);
              }
            }
          }
        };

        renderer.domElement.addEventListener('click', handleClick);

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          const time = Date.now();
          cloudGroup.rotation.y += autoRotateSpeed;

          [cloud1, cloud2].forEach((cloud) => {
            if (cloud) {
              cloud.position.y =
                (cloud.userData as any).originalPosition.y +
                Math.sin(time * (cloud.userData as any).bobSpeed + (cloud.userData as any).bobOffset) *
                  (cloud.userData as any).bobAmount;

              if ((cloud.userData as any).isRaining && (cloud.userData as any).rainGroup) {
                const currentRaindrops = cloud === cloud1 ? raindrops1 : raindrops2;
                currentRaindrops.forEach((raindrop) => {
                  raindrop.position.y -= (raindrop as any).userData.speed;
                  if (raindrop.position.y < -5) {
                    raindrop.position.y = -0.8;
                    raindrop.position.x = (Math.random() - 0.5) * 1.8 * cloud.scale.x;
                    raindrop.position.z = (Math.random() - 0.5) * 1.8 * cloud.scale.z;
                  }
                });
              }
            }
          });
          controls.update();
          renderer.render(scene, camera);
        };

        animate();

        // Cleanup function
        return () => {
          renderer.domElement.removeEventListener('click', handleClick);
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (error) {
        console.error('Error initializing 3D clouds:', error);
      }
    };

    const cleanup = initializeClouds();
    return () => {
      if (cleanup) cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  return (
    <div className="weather-widget-container relative w-full">
      <div className="weather-widget relative text-white bg-gradient-to-br from-purple-700/70 via-indigo-800/60 to-blue-900/70 backdrop-blur-lg shadow-2xl rounded-2xl p-4 overflow-hidden border border-white/10">
        
        {/* 3D Cloud Container */}
        <div
          ref={cloudContainerRef}
          className="absolute top-0 right-0 w-24 h-24 z-30 cursor-pointer rounded-tr-2xl overflow-hidden"
        >
          <div className="tooltip absolute top-16 right-1 bg-black/70 text-white px-2 py-1 rounded-md text-xs opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-40 shadow-lg">
            Click clouds!
            <div className="absolute -top-1 right-2 w-2 h-2 bg-black/70 transform rotate-45"></div>
          </div>
        </div>

        <div className="relative z-20">
          {/* Date and Time */}
          <div className="date-time text-xs font-light opacity-80 mb-2 tracking-wide">
            {currentTime}
          </div>

          {/* Current Weather */}
          <div className="current-weather flex items-center mb-3">
            <div className="weather-icon-main text-3xl mr-2 animate-float">
              {weatherData.condition}
            </div>
            <div className="temp text-3xl font-semibold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                {weatherData.temperature}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="location text-sm opacity-90 mb-3 tracking-wide">
            {weatherData.location}
          </div>

          {/* Sun Info */}
          <div className="sun-info bg-black/30 backdrop-blur-sm rounded-xl p-2 flex justify-between items-center mb-3 border border-white/10 shadow-md">
            <div className="sunrise text-center">
              <div className="sun-icon text-sm mb-1">☀️</div>
              <div className="text-xs opacity-80">{weatherData.sunriseTime}</div>
            </div>
            <div className="day-length text-center text-xs opacity-90">
              {weatherData.dayLength}
            </div>
            <div className="sunset text-center">
              <div className="sun-icon text-sm mb-1">🌙</div>
              <div className="text-xs opacity-80">{weatherData.sunsetTime}</div>
            </div>
          </div>

          {/* Precipitation */}
          <div className="precipitation bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center mb-3 border border-white/5 shadow-sm">
            <div className="precip-icon text-lg mr-2 text-blue-300 drop-shadow-lg animate-bob">
              🌧️
            </div>
            <div className="text-xs opacity-90">
              {weatherData.precipitationChance}
            </div>
          </div>

          {/* Humidity and Wind */}
          <div className="humidity-wind flex justify-between text-xs opacity-90 mb-3">
            <div>{weatherData.humidity}</div>
            <div>{weatherData.windSpeed}</div>
          </div>

          {/* Forecast */}
          <div className="forecast grid grid-cols-4 gap-2">
            {weatherData.forecast.map((day, index) => (
              <div
                key={index}
                className="forecast-day bg-white/5 backdrop-blur-sm rounded-lg p-2 text-center border border-white/10 shadow-sm hover:bg-white/10 transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="day-name text-xs font-medium mb-1 opacity-80">
                  {day.day}
                </div>
                <div className="forecast-icon text-lg my-1 drop-shadow-md hover:scale-110 transition-transform">
                  {day.icon}
                </div>
                <div className="high-temp text-xs font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                  {day.high}
                </div>
                <div className="low-temp text-xs opacity-70">{day.low}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-bob {
          animation: bob 2.5s ease-in-out infinite;
        }
        .weather-widget::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%);
          animation: shimmer 15s infinite linear;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes shimmer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
