"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface APILoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function APILoader({ isVisible, onComplete }: APILoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);

  const processingTexts = [
    "Processing your request...",
    "Understanding context and intent...",
    "Accessing travel knowledge base...",
    "Analyzing destination patterns...",
    "Cross-referencing preferences...",
    "Generating personalized recommendations...",
    "Optimizing itinerary suggestions...",
    "Finalizing response structure...",
  ];

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !isVisible) return;

    // Clear any existing animations
    gsap.killTweensOf("*");

    const star = containerRef.current.getElementsByClassName("n-star");
    const gl = containerRef.current.getElementsByClassName("s-gls");

    // Simplified sunset animation for API processing
    function apiAnimation() {
      const sunsetTl = gsap.timeline({ ease: "linear" });

      gsap.to(gl, {
        x: 4,
        stagger: {
          each: 0.1,
          from: "random",
          repeat: -1,
          yoyo: true,
        },
        duration: 1.5,
        ease: "power1.inOut",
      });

      gsap.to(".s-bw2", {
        rotate: 15,
        transformOrigin: "right bottom",
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        duration: 0.8,
      });
      gsap.to(".s-bw1", {
        rotate: -15,
        transformOrigin: "left bottom",
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        duration: 0.8,
      });

      sunsetTl
        .to(
          "#sunset",
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
          "#s-ml2",
          {
            x: 15,
            duration: 4,
          },
          0
        )
        .to(
          "#s-ml1",
          {
            x: 10,
            duration: 4,
          },
          0
        )
        .to(
          "#s-m2",
          {
            x: 25,
            duration: 4,
          },
          0
        )
        .to(
          "#s-m1",
          {
            x: 20,
            duration: 4,
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
          2.5
        );

      return sunsetTl;
    }

    // Initialize window
    gsap.set("#window-b", {
      scaleY: 23,
      transformOrigin: "top",
    });

    // Master timeline with infinite loop for API processing
    const master = gsap.timeline({
      repeat: -1,
      onComplete: () => {
        if (onComplete) {
          setTimeout(onComplete, 200);
        }
      },
    });

    master.add(apiAnimation());

    // Text rotation with fade effect
    const textInterval = setInterval(() => {
      setIsTextVisible(false);
      setTimeout(() => {
        setCurrentTextIndex((prev) => (prev + 1) % processingTexts.length);
        setIsTextVisible(true);
      }, 300);
    }, 2500);

    // Cleanup function
    return () => {
      gsap.killTweensOf("*");
      clearInterval(textInterval);
    };
  }, [isVisible, onComplete, processingTexts.length]);

  if (!isVisible) return null;

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[75%] rounded-lg px-3 py-2 bg-gray-900 text-gray-100 border border-gray-800">
        <div ref={containerRef} className="flex items-center space-x-3">
          {/* Compact SVG Animation */}
          <div className="w-[60px] h-[45px] flex-shrink-0">
            <svg
              ref={svgRef}
              id="api-loader"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 800 600"
              className="w-full h-full"
            >
              <defs>
                <clipPath id="clip-path-api">
                  <rect
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
              <g id="sunset" opacity="0">
                <g clipPath="url(#clip-path-api)">
                  <path fill="#ed8936" d="M176.32 128.32H530V482H176.32z" />
                  <g id="s-sun" fill="#fef5e7">
                    <circle cx="400" cy="204" r="39" opacity=".5" />
                    <circle cx="400" cy="204" r="33" />
                  </g>
                  <path
                    id="s-ml2"
                    d="M189 285s27.45-18 32.68-16 13.07 8 18.3 8 15.68-4 19.61-6 13.07-10 18.3-7 10.45 7 18.3 5 24.83-8 34-3S372 297 372 297H242.59s-45.75 0-53.59-12z"
                    fill="#dd6b20"
                  />
                  <path
                    id="s-ml1"
                    d="M248 283.1s23.1-20.85 27.5-18.54 11 9.27 15.4 9.27 13.2-4.63 16.5-6.95 11-11.58 15.4-8.11 8.8 8.11 15.4 5.79 20.9-9.26 28.6-3.47S402 297 402 297H293.1s-38.5 0-45.1-13.9z"
                    fill="#ed8936"
                  />
                  <g id="s-m2" fill="#c53030">
                    <path d="M390 312.2s27.64-23.69 32.91-21.06 13.16 10.53 18.43 10.53 15.79-5.26 19.74-7.89 13.16-13.17 18.43-9.22 10.53 9.22 18.43 6.58 25-10.53 34.22-3.95 42.12 21.07 42.12 21.07V328H444s-46.1 0-54-15.8z" />
                  </g>
                  <g id="s-m1" fill="#9c2a00">
                    <path d="M474 363.59s34.16-29.28 40.67-26 16.27 13 22.77 13 19.52-6.5 24.4-9.76 16.27-16.26 22.78-11.38 13 11.38 22.77 8.13 30.91-13 42.29-4.88 52.06 26 52.06 26v24.4h-161s-26.71 0-46.67-6.27c-9.25-2.83-17.01-7.09-20.07-13.24z" />
                  </g>
                  <g id="s-b2" fill="#9c2a00">
                    <path
                      className="s-bw2"
                      d="M314.21 221.05a9.4 9.4 0 019.3 8 9.09 9.09 0 00.12-1.39 9.42 9.42 0 10-18.83 0 10.57 10.57 0 00.11 1.39 9.41 9.41 0 019.3-8z"
                    />
                    <path
                      className="s-bw1"
                      d="M333 221.05a9.4 9.4 0 019.3 8 9.09 9.09 0 00.12-1.39 9.42 9.42 0 10-18.83 0 9.09 9.09 0 00.11 1.39 9.41 9.41 0 019.3-8z"
                    />
                  </g>
                  <g className="s-gl">
                    <rect
                      className="s-gls"
                      x="366.82"
                      y="342.87"
                      width="32.67"
                      height="6.05"
                      rx="3.03"
                      fill="#f6ad55"
                    />
                    <rect
                      className="s-gls"
                      x="361.16"
                      y="351.95"
                      width="32.67"
                      height="6.05"
                      rx="3.03"
                      fill="#f6ad55"
                    />
                    <rect
                      className="s-gls"
                      x="377.5"
                      y="361.02"
                      width="32.67"
                      height="6.05"
                      rx="3.03"
                      fill="#f6ad55"
                    />
                  </g>
                </g>
              </g>
              <g id="window">
                <g clipPath="url(#clip-path-api)">
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

          {/* Processing Text */}
          <div className="flex-1">
            <div className="h-[20px] flex items-center overflow-hidden">
              <p
                className={`text-xs text-gray-300 font-medium transition-all duration-500 ease-out ${
                  isTextVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
              >
                {processingTexts[currentTextIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
