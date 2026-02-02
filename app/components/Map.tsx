"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import gsap from "gsap";
import { Gym } from "../types";

interface MapProps {
  gyms: Gym[];
  countryCode: string;
}

interface GymWithOffset extends Gym {
  offsetX: number;
  offsetY: number;
  zIndex: number;
}

// Collision detection: group gyms by proximity and apply offsets
function applyCollisionOffsets(gyms: Gym[]): GymWithOffset[] {
  const PRECISION = 3; // decimal places for grouping (~111m at equator)
  const OFFSET_PX = 12; // pixel offset between stacked markers
  
  const coordGroups: Record<string, Gym[]> = {};
  
  // Group by rounded coordinates
  gyms.forEach((gym) => {
    const key = `${gym.lat.toFixed(PRECISION)},${gym.lng.toFixed(PRECISION)}`;
    if (!coordGroups[key]) {
      coordGroups[key] = [];
    }
    coordGroups[key].push(gym);
  });
  
  const result: GymWithOffset[] = [];
  
  Object.values(coordGroups).forEach((group) => {
    // Spiral offset pattern for stacked markers
    group.forEach((gym, index) => {
      const angle = (index * 60 * Math.PI) / 180; // 60 degree increments
      const radius = index === 0 ? 0 : OFFSET_PX * Math.ceil(index / 6);
      result.push({
        ...gym,
        offsetX: index === 0 ? 0 : Math.cos(angle) * radius,
        offsetY: index === 0 ? 0 : Math.sin(angle) * radius,
        zIndex: group.length - index, // First in group gets highest z-index
      });
    });
  });
  
  return result;
}

export default function Map({ gyms, countryCode }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const gsapCtxRef = useRef<gsap.Context | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize processed gyms with collision offsets
  const processedGyms = useMemo(() => applyCollisionOffsets(gyms), [gyms]);

  // Initialize map once on mount
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("Mapbox token is missing");
      return;
    }
    mapboxgl.accessToken = token;

    if (map.current) return;
    if (!mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        projection: { name: "mercator" } as mapboxgl.ProjectionSpecification,
        attributionControl: false,
        center: [0, 20],
        zoom: 1,
      });

      map.current.addControl(new mapboxgl.AttributionControl(), "bottom-right");
      map.current.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "bottom-right"
      );

      map.current.on("load", () => {
        setMapLoaded(true);
      });
    } catch (e) {
      console.error("Error initializing map:", e);
      setError("Failed to load map");
    }

    return () => {
      gsapCtxRef.current?.revert();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Memoized marker element creator
  const createMarkerElement = useCallback((gym: GymWithOffset): { el: HTMLDivElement; content: HTMLDivElement } => {
    const el = document.createElement("div");
    el.className = "group relative cursor-pointer";
    el.style.zIndex = String(gym.zIndex);
    
    // Apply collision offset
    if (gym.offsetX !== 0 || gym.offsetY !== 0) {
      el.style.transform = `translate(${gym.offsetX}px, ${gym.offsetY}px)`;
    }
    
    // Marker content container
    const content = document.createElement("div");
    content.className = 
      "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-transform hover:scale-110 overflow-hidden";
    
    // Initial state for animation
    content.style.opacity = "0";
    content.style.transform = "translateY(15px)";
    
    if (gym.logo) {
      const img = document.createElement("img");
      img.src = gym.logo;
      img.alt = gym.name;
      img.width = 40;
      img.height = 40;
      img.loading = "lazy";
      img.decoding = "async";
      img.className = "h-full w-full object-cover";
      content.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "h-4 w-4 rounded-full bg-red-500";
      content.appendChild(placeholder);
    }
    
    el.appendChild(content);
    return { el, content };
  }, []);

  // Memoized popup HTML generator
  const createPopupHTML = useCallback((gym: Gym): string => {
    return `
      <div class="p-2 min-w-[200px]">
        <div class="flex items-center gap-3 mb-2">
          ${gym.logo ? `<img src="${gym.logo}" alt="${gym.name}" width="32" height="32" loading="lazy" class="w-8 h-8 rounded-full object-cover border border-gray-100">` : ''}
          <div>
            <h3 class="font-semibold text-sm leading-tight">${gym.name}</h3>
            <p class="text-xs text-gray-500">${gym.address.split(',')[0]}</p>
          </div>
        </div>
        <a 
          href="${gym.google_maps_url}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="block w-full text-center text-xs bg-gray-900 text-white py-1.5 rounded hover:bg-black transition-colors"
        >
          View on Google Maps
        </a>
      </div>
    `;
  }, []);

  // Render markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clean up previous GSAP context
    gsapCtxRef.current?.revert();

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const markerElements: HTMLDivElement[] = [];

    processedGyms.forEach((gym) => {
      const { el, content } = createMarkerElement(gym);
      markerElements.push(content);

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(createPopupHTML(gym));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([gym.lng, gym.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Animate markers with GSAP context for proper cleanup
    if (markerElements.length > 0) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      gsapCtxRef.current = gsap.context(() => {
        gsap.to(markerElements, {
          opacity: 1,
          y: 0,
          duration: prefersReducedMotion ? 0 : 0.5,
          stagger: prefersReducedMotion ? 0 : {
            each: 0.03,
            from: "random",
          },
          ease: "power2.out",
        });
      });
    }
  }, [processedGyms, mapLoaded, createMarkerElement, createPopupHTML]);

  // Fit bounds when gyms/country change (or on initial load)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (processedGyms.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    processedGyms.forEach((gym) => {
      bounds.extend([gym.lng, gym.lat]);
    });

    if (!bounds.isEmpty()) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12,
        duration: prefersReducedMotion ? 0 : 800,
      });
    }
  }, [processedGyms, countryCode, mapLoaded]);

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] rounded-xl overflow-hidden border border-border bg-surface mb-8">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-red-500">
          {error}
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
