import { EBirdSighting, EBirdRareAlert, MapBounds, FilterOptions } from '@/types/ebird'

const EBIRD_API_BASE = 'https://api.ebird.org/v2'

interface EBirdApiConfig {
  apiKey?: string
  baseUrl?: string
}

class EBirdApiClient {
  private apiKey?: string
  private baseUrl: string

  constructor(config: EBirdApiConfig = {}) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || EBIRD_API_BASE
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    if (!this.apiKey) {
      throw new Error('API key is required. Please add your eBird API key in the header.')
    }

    // Use the Next.js API route as a proxy to avoid CORS issues
    const proxyUrl = new URL('/api/ebird', window.location.origin)
    proxyUrl.searchParams.append('endpoint', endpoint)
    proxyUrl.searchParams.append('apiKey', this.apiKey)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          proxyUrl.searchParams.append(key, String(value))
        }
      })
    }

    console.log('Making API request to proxy:', proxyUrl.toString())

    try {
      const response = await fetch(proxyUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        
        if (response.status === 401) {
          throw new Error(`Invalid API key. Please check your eBird API key. Status: ${response.status}`)
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions.')
        } else {
          throw new Error(`eBird API error: ${response.status} ${response.statusText}. Details: ${errorData.details || errorData.error}`)
        }
      }

      const data = await response.json()
      console.log('API Response data:', data)
      return data
    } catch (error) {
      console.error('Fetch error:', error)
      throw error
    }
  }

  /**
   * Get recent notable observations in a region
   */
  async getNotableObservations(
    regionCode: string,
    options: Partial<FilterOptions> = {}
  ): Promise<EBirdSighting[]> {
    const params: Record<string, string | number> = {
      back: options.back || 14,
      detail: options.detail || 'full',
      hotspot: String(options.hotspot || false),
      sppLocale: options.sppLocale || 'en',
    }

    if (options.maxResults) {
      params.maxResults = options.maxResults
    }

    if (options.r) {
      params.r = options.r
    }

    return this.makeRequest<EBirdSighting[]>(`/data/obs/${regionCode}/recent/notable`, params)
  }

  /**
   * Get recent observations for a specific species
   */
  async getSpeciesObservations(
    speciesCode: string,
    regionCode: string,
    options: Partial<FilterOptions> = {}
  ): Promise<EBirdSighting[]> {
    const params: Record<string, string | number> = {
      back: options.back || 30,
      detail: options.detail || 'full',
      hotspot: String(options.hotspot || false),
      sppLocale: options.sppLocale || 'en',
    }

    if (options.maxResults) {
      params.maxResults = options.maxResults
    }

    if (options.r) {
      params.r = options.r
    }

    return this.makeRequest<EBirdSighting[]>(`/data/obs/${regionCode}/recent/${speciesCode}`, params)
  }

  /**
   * Get nearby hotspots
   */
  async getNearbyHotspots(
    lat: number,
    lng: number,
    radius: number = 25
  ): Promise<any[]> {
    const params = {
      lat: lat.toString(),
      lng: lng.toString(),
      r: radius.toString(),
    }

    return this.makeRequest<any[]>(`/ref/hotspot/geo`, params)
  }

  /**
   * Get region info
   */
  async getRegionInfo(regionCode: string): Promise<any> {
    return this.makeRequest<any>(`/ref/region/info/${regionCode}`)
  }

  /**
   * Get species info
   */
  async getSpeciesInfo(speciesCode: string): Promise<any> {
    return this.makeRequest<any>(`/ref/taxonomy/ebird/${speciesCode}`)
  }

  /**
   * Validate API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      console.log('Validating API key...')
      // Try the notable observations endpoint as it's more reliable for validation
      const result = await this.makeRequest<any[]>('/data/obs/US/recent/notable?back=1&maxResults=1')
      console.log('API key validation successful:', result)
      return true
    } catch (error) {
      console.error('API key validation failed:', error)
      return false
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Get observations within map bounds
   */
  async getObservationsInBounds(
    bounds: MapBounds,
    options: Partial<FilterOptions> = {}
  ): Promise<EBirdSighting[]> {
    // Note: eBird API doesn't directly support bounding box queries
    // This would need to be implemented by querying multiple regions
    // or using a different approach
    
    const centerLat = (bounds.north + bounds.south) / 2
    const centerLng = (bounds.east + bounds.west) / 2
    
    // For now, we'll use a region-based approach
    // You might want to implement a more sophisticated solution
    return this.getNotableObservations('US', options)
  }
}

// Create a singleton instance
export const ebirdApi = new EBirdApiClient()

export default EBirdApiClient 