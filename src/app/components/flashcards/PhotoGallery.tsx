import React from "react";
import { PhotoGalleryState } from "./types";

interface PhotoGalleryProps {
  photoGallery: PhotoGalleryState;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectPhoto: (index: number) => void;
}

export function PhotoGallery({
  photoGallery,
  onClose,
  onNext,
  onPrev,
  onSelectPhoto,
}: PhotoGalleryProps) {
  return (
    <div className="photo-gallery-backdrop" onClick={onClose}>
      <div
        className="photo-gallery-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="gallery-close-btn"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {photoGallery.photos.length > 1 && (
          <>
            <button
              className="gallery-nav-btn gallery-prev"
              onClick={onPrev}
              disabled={photoGallery.currentIndex === 0}
              aria-label="Previous photo"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <button
              className="gallery-nav-btn gallery-next"
              onClick={onNext}
              disabled={
                photoGallery.currentIndex === photoGallery.photos.length - 1
              }
              aria-label="Next photo"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
        )}

        <div className="photo-gallery-content">
          <img
            src={photoGallery.photos[photoGallery.currentIndex]}
            alt={`Photo ${photoGallery.currentIndex + 1}`}
            className="gallery-image"
            onError={(e) => {
              // If image fails to load, use default travel image
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop&auto=format&q=80";
            }}
          />
          {photoGallery.photos.length > 1 && (
            <div className="photo-counter">
              {photoGallery.currentIndex + 1} / {photoGallery.photos.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip for multiple photos */}
        {photoGallery.photos.length > 1 && (
          <div className="photo-thumbnails">
            {photoGallery.photos.map((photo, idx) => (
              <div
                key={idx}
                className={`thumbnail ${
                  idx === photoGallery.currentIndex ? "active" : ""
                }`}
                onClick={() => onSelectPhoto(idx)}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${idx + 1}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&h=100&fit=crop&auto=format&q=80";
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
