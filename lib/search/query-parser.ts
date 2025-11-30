/**
 * Natural language query parser for semantic search
 */

export interface ParsedQuery {
  original: string;
  intent: 'find' | 'compare' | 'recommend' | 'info';
  locations: {
    cities: string[];
    states: string[];
    regions: string[];
  };
  distances: string[];
  organizers: string[];
  keywords: string[];
  filters: {
    priceRange?: { min?: number; max?: number };
    dateRange?: { start?: Date; end?: Date };
    isQualifier?: boolean;
  };
}

// Distance synonyms and variations
const DISTANCE_MAPPINGS: Record<string, string> = {
  'sprint': 'sprint',
  'sprints': 'sprint',
  'super sprint': 'sprint',
  'short': 'sprint',

  'olympic': 'olympic',
  'olympics': 'olympic',
  'standard': 'olympic',
  'oly': 'olympic',

  'half': 'half',
  '70.3': 'half',
  '70 3': 'half',
  'halfironman': 'half',
  'half ironman': 'half',
  'half-ironman': 'half',
  '1/2': 'half',

  'full': 'full',
  '140.6': 'full',
  '140 6': 'full',
  'ironman': 'full',
  'full ironman': 'full',
  'full-ironman': 'full',
};

// US states mapping (abbreviations and full names)
const US_STATES: Record<string, string> = {
  'alabama': 'AL', 'al': 'AL',
  'alaska': 'AK', 'ak': 'AK',
  'arizona': 'AZ', 'az': 'AZ',
  'arkansas': 'AR', 'ar': 'AR',
  'california': 'CA', 'ca': 'CA', 'cali': 'CA',
  'colorado': 'CO', 'co': 'CO',
  'connecticut': 'CT', 'ct': 'CT',
  'delaware': 'DE', 'de': 'DE',
  'florida': 'FL', 'fl': 'FL',
  'georgia': 'GA', 'ga': 'GA',
  'hawaii': 'HI', 'hi': 'HI',
  'idaho': 'ID', 'id': 'ID',
  'illinois': 'IL', 'il': 'IL',
  'indiana': 'IN', 'in': 'IN',
  'iowa': 'IA', 'ia': 'IA',
  'kansas': 'KS', 'ks': 'KS',
  'kentucky': 'KY', 'ky': 'KY',
  'louisiana': 'LA', 'la': 'LA',
  'maine': 'ME', 'me': 'ME',
  'maryland': 'MD', 'md': 'MD',
  'massachusetts': 'MA', 'ma': 'MA', 'mass': 'MA',
  'michigan': 'MI', 'mi': 'MI',
  'minnesota': 'MN', 'mn': 'MN',
  'mississippi': 'MS', 'ms': 'MS',
  'missouri': 'MO', 'mo': 'MO',
  'montana': 'MT', 'mt': 'MT',
  'nebraska': 'NE', 'ne': 'NE',
  'nevada': 'NV', 'nv': 'NV',
  'new hampshire': 'NH', 'nh': 'NH',
  'new jersey': 'NJ', 'nj': 'NJ',
  'new mexico': 'NM', 'nm': 'NM',
  'new york': 'NY', 'ny': 'NY',
  'north carolina': 'NC', 'nc': 'NC',
  'north dakota': 'ND', 'nd': 'ND',
  'ohio': 'OH', 'oh': 'OH',
  'oklahoma': 'OK', 'ok': 'OK',
  'oregon': 'OR', 'or': 'OR',
  'pennsylvania': 'PA', 'pa': 'PA',
  'rhode island': 'RI', 'ri': 'RI',
  'south carolina': 'SC', 'sc': 'SC',
  'south dakota': 'SD', 'sd': 'SD',
  'tennessee': 'TN', 'tn': 'TN',
  'texas': 'TX', 'tx': 'TX',
  'utah': 'UT', 'ut': 'UT',
  'vermont': 'VT', 'vt': 'VT',
  'virginia': 'VA', 'va': 'VA',
  'washington': 'WA', 'wa': 'WA',
  'west virginia': 'WV', 'wv': 'WV',
  'wisconsin': 'WI', 'wi': 'WI',
  'wyoming': 'WY', 'wy': 'WY',
  'washington dc': 'DC', 'dc': 'DC', 'washington d.c.': 'DC',
};

// Major cities for search
const MAJOR_CITIES = [
  'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
  'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
  'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis',
  'seattle', 'denver', 'washington', 'boston', 'nashville', 'baltimore',
  'portland', 'las vegas', 'detroit', 'memphis', 'louisville', 'milwaukee',
  'albuquerque', 'tucson', 'fresno', 'sacramento', 'mesa', 'atlanta',
  'kansas city', 'colorado springs', 'raleigh', 'miami', 'oakland', 'tampa',
  'boulder', 'madison', 'minneapolis', 'st. louis', 'orlando', 'chattanooga',
  'oceanside', 'santa rosa', 'coeur d\'alene', 'lake placid', 'tempe',
];

// Regions
const REGIONS: Record<string, string[]> = {
  'west coast': ['CA', 'OR', 'WA'],
  'southwest': ['AZ', 'NM', 'NV', 'UT', 'CO'],
  'midwest': ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  'southeast': ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  'northeast': ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
  'mountain west': ['ID', 'MT', 'WY'],
};

// Organizer keywords
const ORGANIZERS = [
  'ironman',
  'usa triathlon',
  'usat',
  'life time',
  'lifetime',
  'challenge',
  'rev3',
  'columbia',
  'tri-california',
];

// Intent keywords
const INTENT_KEYWORDS = {
  find: ['find', 'show', 'list', 'search', 'looking for', 'want'],
  compare: ['compare', 'vs', 'versus', 'difference', 'between'],
  recommend: ['best', 'recommend', 'suggest', 'top', 'good', 'popular'],
  info: ['what', 'when', 'where', 'how', 'tell me', 'info', 'information'],
};

export function parseQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase().trim();
  const words = lower.split(/\s+/);

  const result: ParsedQuery = {
    original: query,
    intent: detectIntent(lower),
    locations: {
      cities: [],
      states: [],
      regions: [],
    },
    distances: [],
    organizers: [],
    keywords: [],
    filters: {},
  };

  // Extract distances
  Object.entries(DISTANCE_MAPPINGS).forEach(([key, value]) => {
    if (lower.includes(key) && !result.distances.includes(value)) {
      result.distances.push(value);
    }
  });

  // Extract states
  Object.entries(US_STATES).forEach(([key, value]) => {
    if (lower.includes(key)) {
      if (!result.locations.states.includes(value)) {
        result.locations.states.push(value);
      }
    }
  });

  // Extract cities
  MAJOR_CITIES.forEach(city => {
    if (lower.includes(city)) {
      result.locations.cities.push(city);
    }
  });

  // Extract regions
  Object.entries(REGIONS).forEach(([region, states]) => {
    if (lower.includes(region)) {
      result.locations.regions.push(region);
      // Add states from region
      states.forEach(state => {
        if (!result.locations.states.includes(state)) {
          result.locations.states.push(state);
        }
      });
    }
  });

  // Extract organizers
  ORGANIZERS.forEach(org => {
    if (lower.includes(org)) {
      result.organizers.push(org);
    }
  });

  // Extract price filters
  const priceMatch = lower.match(/under\s+\$?(\d+)|less than\s+\$?(\d+)|below\s+\$?(\d+)/);
  if (priceMatch) {
    const amount = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
    result.filters.priceRange = { max: amount };
  }

  const expensiveMatch = lower.match(/over\s+\$?(\d+)|more than\s+\$?(\d+)|above\s+\$?(\d+)/);
  if (expensiveMatch) {
    const amount = parseInt(expensiveMatch[1] || expensiveMatch[2] || expensiveMatch[3]);
    result.filters.priceRange = { min: amount };
  }

  // Extract qualifier filter
  if (lower.includes('qualifier') || lower.includes('qualifying') || lower.includes('world championship')) {
    result.filters.isQualifier = true;
  }

  // Extract month/season for dates
  const monthMatch = lower.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/);
  if (monthMatch) {
    const monthNames: Record<string, number> = {
      january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
      april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
      august: 7, aug: 7, september: 8, sep: 8, october: 9, oct: 9,
      november: 10, nov: 10, december: 11, dec: 11,
    };
    const monthNum = monthNames[monthMatch[1]];
    if (monthNum !== undefined) {
      const year = new Date().getFullYear();
      result.filters.dateRange = {
        start: new Date(year, monthNum, 1),
        end: new Date(year, monthNum + 1, 0),
      };
    }
  }

  // Season filters
  if (lower.includes('summer')) {
    const year = new Date().getFullYear();
    result.filters.dateRange = {
      start: new Date(year, 5, 1), // June
      end: new Date(year, 8, 0),   // August
    };
  } else if (lower.includes('fall') || lower.includes('autumn')) {
    const year = new Date().getFullYear();
    result.filters.dateRange = {
      start: new Date(year, 8, 1),  // September
      end: new Date(year, 11, 0),   // November
    };
  } else if (lower.includes('spring')) {
    const year = new Date().getFullYear();
    result.filters.dateRange = {
      start: new Date(year, 2, 1),  // March
      end: new Date(year, 5, 0),    // May
    };
  }

  // Extract remaining keywords (filter out common words)
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'with', 'is', 'are', 'what', 'where', 'when', 'how']);
  result.keywords = words.filter(word =>
    !stopWords.has(word) &&
    word.length > 2 &&
    !result.distances.some(d => word.includes(d)) &&
    !result.locations.states.some(s => word.includes(s.toLowerCase())) &&
    !result.locations.cities.some(c => word.includes(c))
  );

  return result;
}

function detectIntent(query: string): 'find' | 'compare' | 'recommend' | 'info' {
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      return intent as 'find' | 'compare' | 'recommend' | 'info';
    }
  }
  return 'find'; // default
}

export function generateSearchSummary(parsed: ParsedQuery): string {
  const parts: string[] = [];

  if (parsed.intent === 'recommend') {
    parts.push('Best');
  } else if (parsed.intent === 'compare') {
    parts.push('Comparing');
  }

  if (parsed.distances.length > 0) {
    parts.push(parsed.distances.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', '));
  }

  parts.push('races');

  if (parsed.locations.cities.length > 0) {
    parts.push('in ' + parsed.locations.cities.join(', '));
  } else if (parsed.locations.states.length > 0) {
    parts.push('in ' + parsed.locations.states.join(', '));
  } else if (parsed.locations.regions.length > 0) {
    parts.push('in ' + parsed.locations.regions.map(r =>
      r.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    ).join(', '));
  }

  if (parsed.organizers.length > 0) {
    parts.push('by ' + parsed.organizers.join(', '));
  }

  if (parsed.filters.isQualifier) {
    parts.push('(World Championship qualifiers)');
  }

  return parts.join(' ').trim();
}
