export interface EBirdLocation {
  locId: string
  name: string
  latitude: number
  longitude: number
  countryCode: string
  countryName: string
  subnational1Code: string
  subnational1Name: string
  subnational2Code?: string
  subnational2Name?: string
  isHotspot: boolean
  locName: string
  lat: number
  lng: number
  hierarchicalName: string
}

/**
 * Bird sighting data from eBird API
 */
export interface EBirdSighting {
  speciesCode: string
  comName: string
  sciName: string
  locId: string
  locName: string
  obsDt: string
  howMany?: number
  lat: number
  lng: number
  obsValid: boolean
  obsReviewed: boolean
  locationPrivate: boolean
  subnational2Code?: string
  subnational2Name?: string
  subnational1Code: string
  subnational1Name: string
  countryCode: string
  countryName: string
  userDisplayName: string
  subId: string
  obsId: string
  checklistId: string
  presenceNoted: boolean
  hasComments: boolean
  firstName: string
  lastName: string
  hasRichMedia: boolean
  locID: string
}

export interface EBirdRareAlert {
  speciesCode: string
  comName: string
  sciName: string
  locId: string
  locName: string
  obsDt: string
  howMany?: number
  lat: number
  lng: number
  obsValid: boolean
  obsReviewed: boolean
  locationPrivate: boolean
  subId: string
  subnational1Code: string
  subnational1Name: string
  countryCode: string
  countryName: string
  userDisplayName: string
  rarity: 'rare' | 'unusual' | 'casual' | 'accidental'
  distance?: number
  timeSince?: string
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

/**
 * User's current location coordinates
 */
export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

/**
 * Filter options for eBird API queries
 */
export interface FilterOptions {
  regionCode: string
  back: number
  detail: 'simple' | 'full'
  hotspot: boolean
  maxResults?: number
  r?: string
  sppLocale: string
}

/**
 * API key validation state
 */
export interface ApiKeyState {
  apiKey: string
  isValid: boolean
  error?: string
} 