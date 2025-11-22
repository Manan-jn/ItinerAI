import React from "react";

interface StayOption {
  stay_id: string;
  property_name: string;
  property_address: string;
  overall_rating: number;
  starting_price: number;
  city: string;
  image?: string;
  amenities?: string[];
  property_type?: string;
}

interface StaysSnippetProps {
  stayOptions: StayOption[];
  dayNumber?: number;
  cityName?: string;
}

export function StaysSnippet({
  stayOptions,
  dayNumber,
  cityName,
}: StaysSnippetProps) {
  // Show only first 4 options
  const displayOptions = stayOptions.slice(0, Math.min(stayOptions.length, 4));

  // Helper to render star rating
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${
              i < fullStars
                ? "text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-xs text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-600">
        {dayNumber
          ? `AI recommended stays for Day ${dayNumber}:`
          : "AI recommended stays:"}
        {cityName && <span className="text-gray-500 ml-1">({cityName})</span>}
      </p>
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {displayOptions.map((stay, index) => (
          <div
            key={stay.stay_id || index}
            className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex gap-3 p-3">
              {/* Hotel Icon/Image */}
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center border border-orange-100">
                {stay.image ? (
                  <img
                    src={stay.image}
                    alt={stay.property_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `
                        <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      `;
                    }}
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                )}
              </div>

              {/* Stay Details */}
              <div className="flex-1 min-w-0">
                {/* Property Name */}
                <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
                  {stay.property_name}
                </h4>

                {/* Rating */}
                <div className="mb-1">{renderRating(stay.overall_rating)}</div>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate">
                    {stay.city || stay.property_address}
                  </span>
                </div>

                {/* Property Type and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {stay.property_type && (
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
                        {stay.property_type}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm text-green-600">
                      ₹{stay.starting_price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">/night</span>
                  </div>
                </div>

                {/* Amenities Preview */}
                {stay.amenities && stay.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stay.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {stay.amenities.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
                        +{stay.amenities.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {stayOptions.length > 4 && (
        <p className="text-xs text-gray-500 italic">
          Showing {displayOptions.length} of {stayOptions.length} stays
        </p>
      )}
    </div>
  );
}
