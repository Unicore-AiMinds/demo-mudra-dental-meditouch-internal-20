// Pincode/Postal Code API Service
// Supports global postal codes with intelligent fallbacks

interface PincodeApiResponse {
  area: string;
  city: string;
  state: string;
  country: string;
}

interface IndianPincodeApiResponse {
  Message: string;
  Status: string;
  PostOffice?: Array<{
    Name: string;
    Description: string;
    BranchType: string;
    DeliveryStatus: string;
    Circle: string;
    District: string;
    Division: string;
    Region: string;
    Block: string;
    State: string;
    Country: string;
  }>;
}

interface GlobalPincodeApiResponse {
  results?: {
    [key: string]: Array<{
      components: {
        city?: string;
        state?: string;
        country?: string;
        neighbourhood?: string;
        suburb?: string;
        county?: string;
      };
    }>;
  };
}

// In-memory cache to avoid repeated API calls
const pincodeCache = new Map<string, PincodeApiResponse>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const cacheTimestamps = new Map<string, number>();

// Smart pincode detection and formatting
function detectPincodeType(pincode: string): 'indian' | 'global' | 'invalid' {
  // Remove all non-alphanumeric characters for analysis
  const cleaned = pincode.replace(/[^a-zA-Z0-9]/g, '');

  // Indian pincode: 6 digits
  if (/^\d{6}$/.test(cleaned)) {
    return 'indian';
  }

  // Global postal codes (US, UK, Canada, etc.)
  if (/^[a-zA-Z0-9]{3,10}$/.test(cleaned)) {
    return 'global';
  }

  return 'invalid';
}

// Get area name from Indian pincode using Indian Postal API
async function getIndianPincodeData(pincode: string): Promise<PincodeApiResponse | null> {
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data: IndianPincodeApiResponse[] = await response.json();

    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.[0]) {
      const postOffice = data[0].PostOffice[0];
      return {
        area: postOffice.Name || postOffice.Block || 'Unknown Area',
        city: postOffice.District,
        state: postOffice.State,
        country: postOffice.Country || 'India'
      };
    }

    return null;
  } catch (error) {
    console.error('Indian pincode API error:', error);
    return null;
  }
}

// Get area name from global postal codes using OpenCage API (free tier)
async function getGlobalPincodeData(pincode: string): Promise<PincodeApiResponse | null> {
  try {
    // Using OpenCage Geocoding API (free tier: 2500 requests/day)
    // You can replace this with any other geocoding API
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${pincode}&key=YOUR_API_KEY&limit=1&no_annotations=1`
    );
    const data: GlobalPincodeApiResponse = await response.json();

    if (data.results && Object.keys(data.results).length > 0) {
      const result = Object.values(data.results)[0][0];
      const components = result.components;

      return {
        area: components.neighbourhood || components.suburb || components.city || 'Unknown Area',
        city: components.city || components.county || 'Unknown City',
        state: components.state || 'Unknown State',
        country: components.country || 'Unknown Country'
      };
    }

    return null;
  } catch (error) {
    console.error('Global pincode API error:', error);
    return null;
  }
}

// Smart fallback for known patterns
function getSmartFallback(pincode: string): PincodeApiResponse {
  const cleaned = pincode.replace(/[^0-9]/g, '');

  // Indian pincode patterns (first digit indicates region)
  if (cleaned.length === 6) {
    const firstDigit = cleaned.charAt(0);
    switch (firstDigit) {
      case '1': return { area: 'Delhi/NCR Area', city: 'Delhi', state: 'Delhi', country: 'India' };
      case '2': return { area: 'Punjab/Haryana Area', city: 'Punjab', state: 'Punjab', country: 'India' };
      case '3': return { area: 'Rajasthan/Gujarat Area', city: 'Rajasthan', state: 'Rajasthan', country: 'India' };
      case '4': return { area: 'Maharashtra Area', city: 'Mumbai', state: 'Maharashtra', country: 'India' };
      case '5': return { area: 'Karnataka/Goa Area', city: 'Bangalore', state: 'Karnataka', country: 'India' };
      case '6': return { area: 'Tamil Nadu/Kerala Area', city: 'Chennai', state: 'Tamil Nadu', country: 'India' };
      case '7': return { area: 'West Bengal/Odisha Area', city: 'Kolkata', state: 'West Bengal', country: 'India' };
      case '8': return { area: 'Northeast India Area', city: 'Guwahati', state: 'Assam', country: 'India' };
      case '9': return { area: 'Andhra Pradesh Area', city: 'Hyderabad', state: 'Telangana', country: 'India' };
    }
  }

  return {
    area: `Area ${pincode}`,
    city: 'Unknown City',
    state: 'Unknown State',
    country: 'Unknown Country'
  };
}

// Main function to get area from any pincode/postal code
export async function getAreaFromPincode(pincode: string): Promise<string> {
  if (!pincode || pincode.trim() === '') {
    return 'No Pincode Provided';
  }

  const cleanedPincode = pincode.trim();

  // Check cache first
  const cached = pincodeCache.get(cleanedPincode);
  const cacheTime = cacheTimestamps.get(cleanedPincode);

  if (cached && cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
    return cached.area;
  }

  // Detect pincode type
  const pincodeType = detectPincodeType(cleanedPincode);

  if (pincodeType === 'invalid') {
    return 'Invalid Pincode';
  }

  let result: PincodeApiResponse | null = null;

  try {
    // Try appropriate API based on pincode type
    if (pincodeType === 'indian') {
      result = await getIndianPincodeData(cleanedPincode);
    } else {
      result = await getGlobalPincodeData(cleanedPincode);
    }

    // If API fails, use smart fallback
    if (!result) {
      result = getSmartFallback(cleanedPincode);
    }

    // Cache the result
    pincodeCache.set(cleanedPincode, result);
    cacheTimestamps.set(cleanedPincode, Date.now());

    return result.area;

  } catch (error) {
    console.error('Pincode lookup error:', error);

    // Return smart fallback on error
    const fallback = getSmartFallback(cleanedPincode);
    return fallback.area;
  }
}

// Get full location data (for future use)
export async function getFullLocationData(pincode: string): Promise<PincodeApiResponse | null> {
  if (!pincode || pincode.trim() === '') {
    return null;
  }

  const cleanedPincode = pincode.trim();

  // Check cache first
  const cached = pincodeCache.get(cleanedPincode);
  const cacheTime = cacheTimestamps.get(cleanedPincode);

  if (cached && cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
    return cached;
  }

  const pincodeType = detectPincodeType(cleanedPincode);

  if (pincodeType === 'invalid') {
    return null;
  }

  try {
    let result: PincodeApiResponse | null = null;

    if (pincodeType === 'indian') {
      result = await getIndianPincodeData(cleanedPincode);
    } else {
      result = await getGlobalPincodeData(cleanedPincode);
    }

    if (!result) {
      result = getSmartFallback(cleanedPincode);
    }

    // Cache the result
    pincodeCache.set(cleanedPincode, result);
    cacheTimestamps.set(cleanedPincode, Date.now());

    return result;

  } catch (error) {
    console.error('Full location lookup error:', error);
    return getSmartFallback(cleanedPincode);
  }
}

// Clear cache (for testing or manual refresh)
export function clearPincodeCache(): void {
  pincodeCache.clear();
  cacheTimestamps.clear();
}

// Get cache statistics (for debugging)
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: pincodeCache.size,
    entries: Array.from(pincodeCache.keys())
  };
}