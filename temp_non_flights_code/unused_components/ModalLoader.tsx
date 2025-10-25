"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface ModalLoaderProps {
  message?: string;
  isVisible: boolean;
  onComplete?: () => void;
}

export default function ModalLoader({
  message = "Processing...",
  isVisible,
  onComplete,
}: ModalLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !isVisible) return;

    // Clear any existing animations
    gsap.killTweensOf("*");

    const star = containerRef.current.getElementsByClassName("n-star");

    // Simplified night animation for modal
    function modalAnimation() {
      const nightTl = gsap.timeline({ ease: "linear" });

      gsap.to(star, {
        scale: 0.3,
        transformOrigin: "center",
        stagger: {
          each: 0.1,
          from: "random",
          repeat: -1,
          yoyo: true,
        },
        duration: 0.6,
        ease: "power1.inOut",
      });

      nightTl
        .to(
          "#night",
          {
            opacity: 1,
            duration: 0,
          },
          0
        )
        .to(
          "#window-b",
          {
            scaleY: 0,
            transformOrigin: "top",
            duration: 1.5,
            ease: "power2.out",
          },
          0
        )
        .to(
          "#n-stars",
          {
            x: 5,
            duration: 3,
          },
          0
        )
        .to(
          "#n-city",
          {
            x: 30,
            duration: 3,
          },
          0
        )
        .to(
          "#window-b",
          {
            scaleY: 23,
            transformOrigin: "top",
            duration: 1.5,
            ease: "power2.out",
          },
          2
        );

      return nightTl;
    }

    // Initialize window
    gsap.set("#window-b", {
      scaleY: 23,
      transformOrigin: "top",
    });

    // Master timeline with shorter duration for modal
    const master = gsap.timeline({
      repeat: -1, // Infinite loop for modal
      onComplete: () => {
        if (onComplete) {
          setTimeout(onComplete, 200);
        }
      },
    });

    master.add(modalAnimation());

    // Cleanup function
    return () => {
      gsap.killTweensOf("*");
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>

      <div ref={containerRef} className="relative z-10">
        <div className="flex flex-col items-center">
          {/* SVG Animation Container - Smaller for modal */}
          <div className="w-[200px] h-[150px] mb-6">
            <svg
              ref={svgRef}
              id="modal-loader"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 800 600"
              className="w-full h-full"
            >
              <defs>
                <clipPath id="clip-path-modal">
                  <rect
                    id="n-mask"
                    x="281.5"
                    y="134.5"
                    width="237"
                    height="321"
                    rx="115.4"
                    fill="none"
                  />
                </clipPath>
              </defs>
              <path id="bg" fill="#1a202c" d="M0 0h800v600H0z" />
              <rect
                id="window-back"
                x="262.3"
                y="108.5"
                width="275.39"
                height="373"
                rx="137.7"
                fill="#2d3748"
              />
              <g id="night" opacity="0">
                <g clipPath="url(#clip-path-modal)">
                  <rect
                    x="281.5"
                    y="134.5"
                    width="237"
                    height="321"
                    rx="115.4"
                    fill="none"
                    stroke="#000"
                    strokeMiterlimit="10"
                    strokeWidth="15"
                  />
                  <path
                    fill="#1a365d"
                    d="M216.68 129.03h344.21v243.82H216.68z"
                  />
                  <g id="n-moon" fill="#e2e8f0">
                    <path
                      d="M394.56 241a24.5 24.5 0 005.18-15.15A24.78 24.78 0 00375 201.06c-.6 0-1.24 0-2 .09l-6 .47 3.67-4.74a30.06 30.06 0 0153.83 18.4 30.19 30.19 0 01-27.69 30l-6 .46z"
                      opacity=".5"
                    />
                    <path d="M394.49 187.87a27.34 27.34 0 00-21.67 10.64c.71-.06 1.44-.1 2.17-.1a27.4 27.4 0 0121.66 44.18 27.4 27.4 0 00-2.16-54.72z" />
                  </g>
                  <g id="n-city">
                    <path
                      d="M262.3 328.45l65.17-16.71 16.71-7.16s9.55 1.59 8.75 5.57 11.93 6.36 11.93 6.36 19.08-5.57 19.48-5.57 15.66-3.18 15.66-3.18l6.23 4 17.5 4.77s1.64 4.78 4 4.78 31.8-4.78 31.8-4.78l27.58-9.28 5.83 7 53.3-6.46 20.69-12.15L599.54 312l-53.3 173.14-283.94 20.71-74.05-118.54s-7.16-24.66-6.36-27-3.18-18.3 4-22.28 16.7-11.93 16.7-11.93 3.19-8.75 4.78-4l1.59 4.77h11.93c3.18 0 10.34-2.38 10.34-2.38l8.75 4 4 2.38z"
                      fill="#2c5282"
                    />
                  </g>
                  <g id="n-stars" fill="#e2e8f0">
                    <path
                      className="n-star"
                      d="M490.75 226.67c-3.49 0-6.32 3.89-6.32 8.68 0-4.79-2.84-8.68-6.33-8.68 3.49 0 6.33-3.89 6.33-8.69 0 4.8 2.83 8.69 6.32 8.69z"
                    />
                    <path
                      className="n-star"
                      d="M309.64 259.63c-3.49 0-6.32 3.89-6.32 8.68 0-4.79-2.83-8.68-6.32-8.68 3.49 0 6.32-3.89 6.32-8.69 0 4.8 2.83 8.69 6.32 8.69z"
                    />
                    <path
                      className="n-star"
                      d="M337.15 176.53c-3.49 0-6.32 3.89-6.32 8.69 0-4.8-2.83-8.69-6.33-8.69 3.5 0 6.33-3.88 6.33-8.68 0 4.8 2.83 8.68 6.32 8.68z"
                    />
                    <path
                      className="n-star"
                      d="M471.08 274.15c-3.49 0-6.32 3.89-6.32 8.69 0-4.8-2.83-8.69-6.32-8.69 3.49 0 6.32-3.89 6.32-8.68 0 4.79 2.83 8.68 6.32 8.68z"
                    />
                    <path
                      className="n-star"
                      d="M515.2 171.26c-3.5 0-6.32 3.89-6.32 8.69 0-4.8-2.84-8.69-6.33-8.69 3.49 0 6.33-3.88 6.33-8.68 0 4.8 2.82 8.68 6.32 8.68z"
                    />
                    <path
                      className="n-star"
                      d="M416.74 291.53c-3.49 0-6.32 3.89-6.32 8.69 0-4.8-2.83-8.69-6.32-8.69 3.49 0 6.32-3.89 6.32-8.69 0 4.8 2.83 8.69 6.32 8.69z"
                    />
                  </g>
                </g>
              </g>
              <g id="window">
                <g clipPath="url(#clip-path-modal)">
                  <path
                    id="window-b"
                    fill="#2d3748"
                    d="M280.5 134h238v15.45h-238z"
                  />
                </g>
                <rect
                  x="281.5"
                  y="134.5"
                  width="237"
                  height="321"
                  rx="115.4"
                  fill="none"
                  stroke="#4a5568"
                  strokeMiterlimit="10"
                  strokeWidth="16"
                />
              </g>
            </svg>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <h3 className="text-lg font-light text-white mb-2">ItinerAI</h3>
            <p className="text-gray-400 text-sm">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
