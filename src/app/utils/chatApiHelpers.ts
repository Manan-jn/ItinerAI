/**
 * Utility functions for chat API interactions
 * Includes response cleaning, JSON parsing, and API call logic
 */

/**
 * Cleans backticks and markdown code blocks from API response
 * Attempts multiple strategies to parse JSON with various sanitization levels
 * 
 * @param data - Raw response data from the API
 * @returns Cleaned and parsed response data
 */
export function cleanBackticksFromResponse(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (data.message && typeof data.message === "string") {
    let cleanedMessage = data.message;

    // Remove markdown code blocks: ```json\n{...}\n``` or ```{...}```
    // Pattern 1: ```json\n...\n```
    cleanedMessage = cleanedMessage.replace(/^```json\s*\n/i, "");
    cleanedMessage = cleanedMessage.replace(/\n```\s*$/, "");

    // Pattern 2: ```...```
    cleanedMessage = cleanedMessage.replace(/^```\s*/, "");
    cleanedMessage = cleanedMessage.replace(/\s*```$/, "");

    // Trim whitespace
    cleanedMessage = cleanedMessage.trim();

    // If the cleaned message looks like JSON, try to parse it
    if (cleanedMessage.startsWith("{") || cleanedMessage.startsWith("[")) {
      try {
        // First attempt: Direct parse
        const parsed = JSON.parse(cleanedMessage);
        console.log(
          "✅ Successfully parsed cleaned message as JSON (direct)"
        );
        return { ...data, message: parsed };
      } catch (e: any) {
        console.warn(
          "⚠️ Direct JSON parse failed, attempting to sanitize control characters:",
          e.message
        );

        try {
          // Second attempt: Sanitize control characters
          // Replace unescaped control characters with escaped versions
          let sanitized = cleanedMessage;

          // First, remove any literal backspace characters that may have been added incorrectly
          sanitized = sanitized.replace(/[\b]/g, "");

          // Handle common control character issues in JSON strings
          // This regex finds string values and fixes unescaped control chars within them
          sanitized = sanitized.replace(
            /"([^"\\]*(\\.[^"\\]*)*)"/g,
            (match: string) => {
              // Don't modify keys like "response_type", only string values
              // Check if this is likely a value (not a key)
              return match
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/\t/g, "\\t")
                .replace(/\f/g, "\\f");
              // Note: backspace chars already removed above
            }
          );

          const parsed = JSON.parse(sanitized);
          console.log(
            "✅ Successfully parsed cleaned message as JSON (after sanitization)"
          );
          return { ...data, message: parsed };
        } catch (e2: any) {
          console.warn(
            "⚠️ Sanitized JSON parse failed, attempting JSON5-like parse:",
            e2.message
          );

          try {
            // Third attempt: More aggressive sanitization
            // Remove all literal control characters (not escaped)
            let aggressiveSanitized = cleanedMessage
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r")
              .replace(/\t/g, "\\t");

            const parsed = JSON.parse(aggressiveSanitized);
            console.log(
              "✅ Successfully parsed cleaned message as JSON (aggressive sanitization)"
            );
            return { ...data, message: parsed };
          } catch (e3: any) {
            console.error("❌ All JSON parse attempts failed:", e3.message);
            console.error(
              "Failed at character position:",
              e3.message.match(/position (\d+)/)?.[1]
            );

            // Return the cleaned message as-is if parsing fails completely
            return { ...data, message: cleanedMessage };
          }
        }
      }
    }

    return { ...data, message: cleanedMessage };
  }

  return data;
}

/**
 * Makes an API call to the chat endpoint with timeout and error handling
 * 
 * @param userId - User identifier
 * @param sessionId - Session identifier
 * @param currentInput - User's message content
 * @returns Promise with the parsed API response
 */
export async function makeChatAPICall(
  userId: string,
  sessionId: string,
  currentInput: string
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log("Request timeout after 2 minutes");
    controller.abort();
  }, 600000); // 2 minutes timeout

  try {
    console.log("Making API call...");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        message: currentInput,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("API Request sent:", {
      user_id: userId,
      session_id: sessionId,
      message: currentInput,
    });
    console.log("API Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error Response:", errorData);
      throw new Error(
        errorData.error || `API error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Raw API Response:", data);

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === "AbortError") {
      console.error("Request was aborted (timeout)");
      throw new Error("Request timeout. Please try again.");
    }
    
    console.error("Error in API call:", error);
    throw error;
  }
}

