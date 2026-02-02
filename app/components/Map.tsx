"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import gsap from "gsap";
import { Gym } from "../types";

interface MapProps {
  gyms: Gym[];
  countryCode: string;
}

export default function Map({ gyms, countryCode }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Render markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const markerElements: HTMLDivElement[] = [];

    gyms.forEach((gym) => {
      // Create marker element
      const el = document.createElement("div");
      el.className = "group relative cursor-pointer";
      
      // Marker content container
      const content = document.createElement("div");
      content.className = 
        "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 transition-transform hover:scale-110 overflow-hidden";
      
      // Initial state for animation
      content.style.opacity = "0";
      content.style.transform = "translateY(15px)";
      markerElements.push(content);
      
      if (gym.logo) {
        const img = document.createElement("img");
        img.src = gym.logo;
        img.alt = gym.name;
        img.className = "h-full w-full object-cover";
        content.appendChild(img);
      } else {
        // Fallback icon (simple circle for now)
        const placeholder = document.createElement("div");
        placeholder.className = "h-4 w-4 rounded-full bg-red-500";
        content.appendChild(placeholder);
      }
      
      el.appendChild(content);

      // Create popup
      const popupHTML = `
        <div class="p-2 min-w-[200px]">
          <div class="flex items-center gap-3 mb-2">
            ${gym.logo ? `<img src="${gym.logo}" alt="${gym.name}" class="w-8 h-8 rounded-full object-cover border border-gray-100">` : ''}
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

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(popupHTML);

      // Create and add marker
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([gym.lng, gym.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Animate markers
    if (markerElements.length > 0) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      gsap.to(markerElements, {
        opacity: 1,
        y: 0,
        duration: prefersReducedMotion ? 0 : 0.6,
        stagger: prefersReducedMotion ? 0 : {
          each: 0.05,
          from: "random",
        },
        ease: "power3.out",
      });
    }
  }, [gyms, mapLoaded]);

  // Fit bounds when gyms/country change (or on initial load)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (gyms.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    gyms.forEach((gym) => {
      bounds.extend([gym.lng, gym.lat]);
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12,
        duration: 1000,
      });
    }
  }, [gyms, countryCode, mapLoaded]);

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
