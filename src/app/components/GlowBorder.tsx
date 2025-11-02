"use client";

import React from "react";

export interface GlowBorderProps {
  children: React.ReactNode;
  className?: string;
  glowColors?: string[];
  glowSize?: string;
  glowIntensity?: string;
  borderWidth?: string;
}

export default function GlowBorder({
  children,
  className = "",
  glowColors = ["#9333ea", "#7c3aed", "#6d28d9", "#5b21b6", "#9333ea"],
  glowSize = "1rem",
  glowIntensity = "0.125",
  borderWidth = "3px",
}: GlowBorderProps) {
  const gradientColors = glowColors.join(", ");

  return (
    <>
      <div className={`glow-border-wrapper ${className}`}>
        {children}
      </div>

      <style jsx>{`
        @property --glow-deg {
          syntax: "<angle>";
          inherits: true;
          initial-value: -90deg;
        }

        .glow-border-wrapper {
          --gradient-glow: ${gradientColors};
          --glow-size: ${glowSize};
          --glow-intensity: ${glowIntensity};
          --border-width: ${borderWidth};

          /* Main element with conic gradient border */
          border: var(--border-width) solid transparent;
          border-radius: inherit;
          background: linear-gradient(white 0 0) padding-box,
            conic-gradient(from var(--glow-deg), var(--gradient-glow)) border-box;

          position: relative;
          isolation: isolate;

          animation: glow 10s infinite linear;
        }

        .glow-border-wrapper::before,
        .glow-border-wrapper::after {
          content: "";
          position: absolute;
          border-radius: inherit;
          pointer-events: none;
        }

        /* Inner glow layer - scaled and blurred */
        .glow-border-wrapper::before {
          z-index: -1;
          background: white;
          inset: 0.5rem;
          scale: 1.2 1;
          transform-origin: center;
          filter: blur(var(--glow-size));
        }

        /* Outer glow layer - extended and blurred with opacity */
        .glow-border-wrapper::after {
          z-index: -2;
          inset: -1.5rem;
          background: conic-gradient(from var(--glow-deg), var(--gradient-glow));
          filter: blur(var(--glow-size));
          opacity: var(--glow-intensity);
          animation: glow 10s infinite linear;
        }

        @keyframes glow {
          0% {
            --glow-deg: -90deg;
          }
          100% {
            --glow-deg: 270deg;
          }
        }
      `}</style>
    </>
  );
}
