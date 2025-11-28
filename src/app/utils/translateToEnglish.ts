/**
 * Utility to translate text to English using Google Translate API
 * This ensures all chat inputs are in English before sending to the backend
 */

declare global {
  interface Window {
    google: any;
  }
}

/**
 * Detects the language of the given text
 * @param text - The text to detect language for
 * @returns The detected language code or 'en' if detection fails
 */
async function detectLanguage(text: string): Promise<string> {
  try {
    // Use a free language detection API
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    const data = await response.json();
    
    // The API returns the detected language in the response
    if (data && data[2]) {
      return data[2]; // Detected source language
    }
    
    return "en"; // Default to English if detection fails
  } catch (error) {
    console.error("Language detection failed:", error);
    return "en";
  }
}

/**
 * Translates text to English using Google Translate API
 * @param text - The text to translate
 * @returns The translated text in English
 */
export async function translateToEnglish(text: string): Promise<string> {
  // If text is empty or only whitespace, return as is
  if (!text || !text.trim()) {
    return text;
  }

  try {
    // Detect if text is already in English (basic check)
    const englishPattern = /^[a-zA-Z0-9\s\.,!?\-'"]+$/;
    const seemsEnglish = englishPattern.test(text);

    // Detect language first
    const detectedLang = await detectLanguage(text);
    

    // If already in English, return as is
    if (detectedLang === "en" || seemsEnglish) {
      return text;
    }

    // Use Google Translate API (free tier) to translate
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${detectedLang}&tl=en&dt=t&q=${encodeURIComponent(
        text
      )}`
    );

    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return text; // Return original text if API fails
    }

    const data = await response.json();

    // Extract translated text from response
    // The API returns an array where the first element contains translation segments
    if (data && data[0] && Array.isArray(data[0])) {
      const translatedText = data[0]
        .map((segment: any) => segment[0])
        .join("");
      

      return translatedText;
    }

    // If parsing fails, return original text
    console.warn("Failed to parse translation response, returning original text");
    return text;
  } catch (error) {
    console.error("Translation error:", error);
    // If translation fails, return original text
    return text;
  }
}

/**
 * Alternative method using Google Cloud Translation API (if available)
 * This requires an API key but provides better accuracy
 */
export async function translateToEnglishWithAPIKey(
  text: string,
  apiKey?: string
): Promise<string> {
  if (!text || !text.trim()) {
    return text;
  }

  if (!apiKey) {
    console.warn("No API key provided, falling back to free translation");
    return translateToEnglish(text);
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          target: "en",
          format: "text",
        }),
      }
    );

    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return translateToEnglish(text); // Fallback to free API
    }

    const data = await response.json();

    if (data.data && data.data.translations && data.data.translations[0]) {
      const translatedText = data.data.translations[0].translatedText;
      
      console.log("🌐 Translation with API key successful:", {
        original: text,
        translated: translatedText,
      });

      return translatedText;
    }

    return text;
  } catch (error) {
    console.error("Translation with API key error:", error);
    return translateToEnglish(text); // Fallback to free API
  }
}

/**
 * Batch translate multiple texts to English
 * Useful for translating multiple messages at once
 */
export async function batchTranslateToEnglish(
  texts: string[]
): Promise<string[]> {
  const translations = await Promise.all(
    texts.map((text) => translateToEnglish(text))
  );
  return translations;
}

