// Types for API requests and responses
export interface ConveyanceRequest {
  user_id?: string;
  conveyance_type: 'flights' | 'trains';
  departure_city: string;
  departure_country?: string;
  arrival_city: string;
  arrival_country?: string;
  from_date?: string; // YYYY-MM-DD format (deprecated, use start_date)
  to_date?: string;   // YYYY-MM-DD format (deprecated, use end_date)
  start_date?: string; // YYYY-MM-DD format
  end_date?: string;   // YYYY-MM-DD format
}

export interface StayRequest {
  user_id?: string;
  city: string;
  state?: string;
  country?: string;
  from_date?: string; // YYYY-MM-DD format (deprecated)
  to_date?: string;   // YYYY-MM-DD format (deprecated)
  start_check_in_date?: string; // YYYY-MM-DD format
  end_check_in_date?: string;   // YYYY-MM-DD format
  duration?: number; // -1 for full calendar, otherwise days count
}

export interface FlightData {
  flight_id: string;
  airline: string;
  flight_number: string;
  departure_airport: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  arrival_airport: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  departure_date: string;
  arrival_date: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: {
    economy: number;
    business: number;
    first: number | null;
  };
  currency: string;
  travel_class_options: string[];
}

export interface TrainData {
  train_id: string;
  train_name: string;
  train_number: string;
  departure_station: {
    code: string;
    name: string;
    city: string;
  };
  arrival_station: {
    code: string;
    name: string;
    city: string;
  };
  departure_date: string;
  arrival_date: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: {
    '1AC': number | null;
    '2AC': number | null;
    '3AC': number | null;
    'SL': number | null;
  };
  currency: string;
  available_classes: string[];
}

export interface StayData {
  stay_id: string;
  property_name: string;
  property_address: string;
  property_location: string;
  city: string;
  state: string;
  country: string;
  overall_rating: number;
  starting_price: string;
  currency: string;
  available_rooms_total: number;
  available_from_date: string;
  available_until_date: string;
}

export interface DatePriceInfo {
  date: string; // YYYY-MM-DD
  cheapestFlightPrice: number | null;
  cheapestTrainPrice: number | null;
  cheapestStayPrice: number | null;
}

// Temporary mock data function for testing
async function fetchMockFlightData(): Promise<FlightData[]> {
  try {
    const response = await fetch('/flights_date.json');
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.log('Mock data not available, using empty array');
  }
  return [];
}

// API call functions
export async function fetchConveyanceData(request: ConveyanceRequest): Promise<FlightData[]> {
  try {
    console.log('Fetching conveyance data with request:', request);
    
    // Try API first
    const response = await fetch('/api/utility/conveyance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Received conveyance data from API:', data?.length || 0, 'flights');
      return Array.isArray(data) ? data : [];
    } else {
      console.log('API failed, trying mock data');
      // Fallback to mock data for testing
      const mockData = await fetchMockFlightData();
      
      // Filter mock data based on request (basic filtering for demo)
      const filteredData = mockData.filter(flight => {
        const departureCity = flight.departure_airport.city.toLowerCase();
        const arrivalCity = flight.arrival_airport.city.toLowerCase();
        const reqDepartureCity = request.departure_city.toLowerCase();
        const reqArrivalCity = request.arrival_city.toLowerCase();
        
        return departureCity.includes(reqDepartureCity) || reqDepartureCity.includes(departureCity) ||
               arrivalCity.includes(reqArrivalCity) || reqArrivalCity.includes(arrivalCity);
      });
      
      console.log('Using mock data:', filteredData.length, 'flights');
      return filteredData;
    }
  } catch (error) {
    console.error('Error fetching conveyance data:', error);
    // Fallback to mock data
    const mockData = await fetchMockFlightData();
    console.log('Using mock data as fallback:', mockData.length, 'flights');
    return mockData;
  }
}

// Temporary mock data function for stays
async function fetchMockStayData(): Promise<StayData[]> {
  try {
    const response = await fetch('/stay_data.json');
    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.log('Mock stay data not available, using empty array');
  }
  return [];
}

export async function fetchStayData(request: StayRequest): Promise<StayData[]> {
  try {
    console.log('Fetching stay data with request:', request);
    
    // Try API first
    const response = await fetch('/api/utility/stay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Received stay data from API:', data?.length || 0, 'stays');
      return Array.isArray(data) ? data : [];
    } else {
      console.log('Stay API failed, trying mock data');
      // Fallback to mock data for testing
      const mockData = await fetchMockStayData();
      
      // Filter mock data based on request city
      const filteredData = mockData.filter(stay => {
        const stayCity = stay.city.toLowerCase();
        const reqCity = request.city.toLowerCase();
        
        return stayCity.includes(reqCity) || reqCity.includes(stayCity);
      });
      
      console.log('Using mock stay data:', filteredData.length, 'stays');
      return filteredData;
    }
  } catch (error) {
    console.error('Error fetching stay data:', error);
    // Fallback to mock data
    const mockData = await fetchMockStayData();
    console.log('Using mock stay data as fallback:', mockData.length, 'stays');
    return mockData;
  }
}

// Utility functions to process price data
export function getDateRangeForMonth(year: number, month: number): { from_date: string; to_date: string } {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  return {
    from_date: firstDay.toISOString().split('T')[0],
    to_date: lastDay.toISOString().split('T')[0],
  };
}

export function findCheapestFlightPriceForDate(flights: FlightData[], date: string, flightClass: string = 'economy'): number | null {
  const flightsForDate = flights.filter(flight => flight.departure_date === date);
  
  if (flightsForDate.length === 0) return null;
  
  // Map flight class names to API keys
  const classMapping: { [key: string]: keyof FlightData['price'] } = {
    'economy': 'economy',
    'premium economy': 'business', // Map premium economy to business
    'business': 'business',
    'first class': 'first',
    'first': 'first'
  };
  
  const classKey = classMapping[flightClass.toLowerCase()] || 'economy';
  
  const prices = flightsForDate
    .map(flight => {
      return flight.price[classKey];
    })
    .filter(price => price !== null && price !== undefined) as number[];
  
  console.log(`Found ${prices.length} prices for date ${date}, class ${flightClass}:`, prices);
  
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function findCheapestTrainPriceForDate(trains: TrainData[], date: string, trainClass: string = 'SL'): number | null {
  const trainsForDate = trains.filter(train => train.departure_date === date);
  
  if (trainsForDate.length === 0) return null;
  
  // Map train class names to API keys
  const classMapping: { [key: string]: keyof TrainData['price'] } = {
    '1ac': '1AC',
    '2ac': '2AC',
    '3ac': '3AC',
    'sl': 'SL',
    'sleeper': 'SL'
  };
  
  const classKey = classMapping[trainClass.toLowerCase()] || 'SL';
  
  const prices = trainsForDate
    .map(train => train.price[classKey])
    .filter(price => price !== null && price !== undefined) as number[];
  
  console.log(`Found ${prices.length} train prices for date ${date}, class ${trainClass}:`, prices);
  
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function findCheapestStayPriceForDate(stays: StayData[], date: string): number | null {
  const staysForDate = stays.filter(stay => {
    const availableFrom = new Date(stay.available_from_date);
    const availableUntil = new Date(stay.available_until_date);
    const checkDate = new Date(date);
    
    return checkDate >= availableFrom && checkDate <= availableUntil;
  });
  
  if (staysForDate.length === 0) return null;
  
  const prices = staysForDate
    .map(stay => parseInt(stay.starting_price))
    .filter(price => !isNaN(price));
  
  return prices.length > 0 ? Math.min(...prices) : null;
}

export function processPriceDataForMonth(
  flights: FlightData[], 
  trains: TrainData[],
  stays: StayData[], 
  year: number, 
  month: number,
  flightClass: string = 'economy',
  trainClass: string = 'SL'
): DatePriceInfo[] {
  console.log(`Processing price data for ${year}-${month}, flights: ${flights.length}, trains: ${trains.length}, stays: ${stays.length}, flightClass: ${flightClass}, trainClass: ${trainClass}`);
  
  const lastDay = new Date(year, month + 1, 0).getDate();
  const priceData: DatePriceInfo[] = [];
  
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day).toISOString().split('T')[0];
    
    const flightPrice = findCheapestFlightPriceForDate(flights, date, flightClass);
    const trainPrice = findCheapestTrainPriceForDate(trains, date, trainClass);
    const stayPrice = findCheapestStayPriceForDate(stays, date);
    
    priceData.push({
      date,
      cheapestFlightPrice: flightPrice,
      cheapestTrainPrice: trainPrice,
      cheapestStayPrice: stayPrice,
    });
  }
  
  console.log('Processed price data sample:', priceData.slice(0, 5));
  return priceData;
}

// Helper to check if filters are sufficient for API calls
export function hasValidFlightFilters(fromCity: string, toCity: string): boolean {
  return fromCity !== "Select City" && toCity !== "Select City" && fromCity !== toCity;
}

export function hasValidStayFilters(toCity: string): boolean {
  return toCity !== "Select City";
}
