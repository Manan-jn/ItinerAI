/**
 * Utility to get pre-trip markdown content from backend API
 */

// Sample markdown content (fallback)
const SAMPLE_MARKDOWN = `# PRE-TRIP BRIEF — Sample Trip
**Generated on:** ${new Date().toISOString()}

---

## SUMMARY
This brief provides essential safety and preparedness information for your trip.

---

## 1. TRAVEL INFORMATION
Your trip details and important information.

## 2. IMPORTANT CONTACTS
- Emergency Services
- Local Authorities
- Embassy Information

## 3. SAFETY GUIDELINES
- Follow local regulations
- Keep emergency contacts handy
- Stay aware of your surroundings

---

*This is a sample pre-trip brief. In production, detailed information will be loaded from your travel data.*`;

/**
 * Get pre-trip markdown content from backend API
 * @param userId - User ID
 * @param sessionId - Session ID
 * @returns Promise<string> - Markdown content
 */
export async function getPreTripMarkdown(
  userId: string,
  sessionId: string
): Promise<string> {
  try {
    console.log("🔄 Fetching pre-trip brief from API:", { userId, sessionId });

    // Call the Next.js API route which proxies to the backend
    const response = await fetch("/api/pre-trip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Pre-trip API error:", {
        status: response.status,
        error: errorData,
      });

      // Try to fetch from public folder as fallback
      const fallbackResponse = await fetch("/pre_trip_markdown.md");
      if (fallbackResponse.ok) {
        return await fallbackResponse.text();
      }

      // Return sample markdown as last resort
      return SAMPLE_MARKDOWN;
    }

    const data = await response.json();

    // The message field contains the markdown content
    if (data.message && typeof data.message === "string") {
      return data.message;
    }

    // If message is empty, try fallback
    console.warn("⚠️ Empty message in response, using fallback");
    const fallbackResponse = await fetch("/pre_trip_markdown.md");
    if (fallbackResponse.ok) {
      return await fallbackResponse.text();
    }

    return SAMPLE_MARKDOWN;
  } catch (error) {
    console.error("❌ Error loading pre-trip markdown:", error);

    // Try to fetch from public folder as fallback
    try {
      const fallbackResponse = await fetch("/pre_trip_markdown.md");
      if (fallbackResponse.ok) {
        return await fallbackResponse.text();
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
    }

    // Return sample markdown as last resort
    return SAMPLE_MARKDOWN;
  }
}

/**
 * Get pre-trip markdown content synchronously (uses sample data)
 * @param tripData - Trip data object
 * @returns string - Markdown content
 */
export function getPreTripMarkdownSync(tripData?: any): string {
  let content = SAMPLE_MARKDOWN;
  
  if (tripData) {
    content = content
      .replace(/Sample Trip/g, tripData.trip_title || 'Your Trip')
      .replace(/Traveler/g, tripData.user_name || 'Traveler');
  }
  
  return content;
}

