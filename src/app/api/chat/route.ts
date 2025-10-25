import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  message: string;
  sessionId: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, sessionId, userId } = body;

    // Validate input
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Simulate AI response processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate a contextual response based on the message content
    let response = "";
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("trip") || lowerMessage.includes("travel") || lowerMessage.includes("plan")) {
      response = "I'd be happy to help you plan your trip! To get started, could you tell me:\n\n• Where would you like to go?\n• When are you planning to travel?\n• How many days will you be traveling?\n• What's your approximate budget?\n• What type of activities interest you most?\n\nWith this information, I can create a personalized itinerary for you!";
    } else if (lowerMessage.includes("budget") || lowerMessage.includes("cost") || lowerMessage.includes("price")) {
      response = "I can help you plan a budget-friendly trip! Travel costs vary greatly depending on:\n\n• Destination (domestic vs international)\n• Season (peak vs off-season)\n• Accommodation type (hostels, hotels, luxury resorts)\n• Transportation method\n• Activities and dining preferences\n\nCould you share your destination and rough budget range? I'll suggest the best options for your money!";
    } else if (lowerMessage.includes("destination") || lowerMessage.includes("where")) {
      response = "Great question! Here are some amazing destinations to consider:\n\n🏔️ **Adventure**: Nepal, New Zealand, Patagonia\n🏖️ **Beach**: Maldives, Bali, Greek Islands\n🏛️ **Culture**: Japan, India, Morocco\n🌆 **City**: Tokyo, Paris, New York\n🌿 **Nature**: Costa Rica, Iceland, Norway\n\nWhat type of experience are you looking for? I can provide more specific recommendations!";
    } else if (lowerMessage.includes("activity") || lowerMessage.includes("do") || lowerMessage.includes("see")) {
      response = "There are so many amazing activities to choose from! Here are some popular categories:\n\n🎯 **Adventure**: Hiking, scuba diving, bungee jumping\n🎨 **Cultural**: Museums, local tours, cooking classes\n🍽️ **Food**: Street food tours, wine tasting, local markets\n📸 **Sightseeing**: Landmarks, scenic viewpoints, photo spots\n🛍️ **Shopping**: Local markets, boutiques, souvenirs\n\nWhat interests you most? I can suggest specific activities for your destination!";
    } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
      response = "Hello! 👋 Welcome to ItinerAI, your personal travel planning assistant!\n\nI'm here to help you create amazing travel experiences. I can assist with:\n\n✈️ Trip planning and itineraries\n🏨 Accommodation recommendations\n🍽️ Restaurant and food suggestions\n🎯 Activity and attraction ideas\n💰 Budget planning and tips\n📅 Best times to visit destinations\n\nWhat would you like to explore today?";
    } else if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
      response = "You're very welcome! 😊 I'm always here to help make your travel dreams come true.\n\nFeel free to ask me anything else about:\n• Destination recommendations\n• Itinerary planning\n• Travel tips and advice\n• Budget optimization\n• Local experiences\n\nHappy travels! ✈️🌍";
    } else {
      response = `I understand you're interested in "${message}". Let me help you with that!\n\nAs your AI travel companion, I can provide detailed information about destinations, create custom itineraries, suggest activities, and help with budget planning.\n\nCould you be more specific about what aspect of travel planning you'd like help with? For example:\n• Planning a specific trip\n• Finding destinations that match your interests\n• Getting travel tips and advice\n• Budget planning guidance\n\nI'm here to make your travel planning as smooth as possible! 🌟`;
    }

    // Log the interaction (in a real app, you'd save this to a database)
    console.log(`Chat interaction - User: ${userId}, Session: ${sessionId}, Message: ${message}`);

    return NextResponse.json({
      message: response,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
