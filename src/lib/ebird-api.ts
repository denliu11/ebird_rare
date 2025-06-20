import { EBirdSighting, FilterOptions } from '@/types/ebird'

const EBIRD_API_BASE = 'https://api.ebird.org/v2'

interface EBirdApiConfig {
  apiKey?: string
  baseUrl?: string
}

/**
 * eBird API client for fetching bird sighting data
 * Handles authentication, request proxying, and error handling
 */
class EBirdApiClient {
  private apiKey?: string
  private baseUrl: string

  constructor(config: EBirdApiConfig = {}) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || EBIRD_API_BASE
  }

  /**
   * Set the API key for authentication
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Make a request to the eBird API through our proxy
   * @param endpoint - API endpoint path
   * @param params - Query parameters
   * @returns Promise with the API response data
   */
  private async makeRequest<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    if (!this.apiKey) {
      throw new Error('API key is required. Please add your eBird API key in the header.')
    }

    // Use the Next.js API route as a proxy to avoid CORS issues
    // Construct the proxy URL - use relative URL which works in all contexts
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
    console.log('API Key being used:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'not set')

    try {
      const response = await fetch(proxyUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', response.status, errorText)
        
        if (response.status === 401) {
          throw new Error(`Invalid API key. Please check your eBird API key. Status: ${response.status}`)
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions.')
        } else {
          throw new Error(`eBird API error: ${response.status} ${response.statusText}. Details: ${errorText}`)
        }
      }

      const data = await response.json()
      console.log('API Response data length:', Array.isArray(data) ? data.length : 'not an array')
      console.log('API Response data sample:', Array.isArray(data) && data.length > 0 ? data[0] : data)
      return data
    } catch (error) {
      console.error('Fetch error:', error)
      throw error
    }
  }

  /**
   * Get recent notable observations in a region
   * @param regionCode - eBird region code (e.g., 'US', 'US-NY')
   * @param options - Filter options for the query
   * @returns Promise with array of bird sightings
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
   * Validate API key by making a simple request
   * @returns Promise with boolean indicating if API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      console.log('Validating API key...')
      console.log('Current API key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'not set')
      
      // Try the notable observations endpoint as it's more reliable for validation
      const result = await this.makeRequest<any[]>('/data/obs/US/recent/notable?back=1&maxResults=1')
      console.log('API key validation successful:', result)
      return true
    } catch (error) {
      console.error('API key validation failed:', error)
      return false
    }
  }
}

// Create a singleton instance only on the client side
let ebirdApiInstance: EBirdApiClient | null = null

/**
 * Get the eBird API client instance (client-side only)
 */
export function getEbirdApi(): EBirdApiClient {
  if (typeof window === 'undefined') {
    throw new Error('eBird API client can only be used on the client side')
  }
  
  if (!ebirdApiInstance) {
    ebirdApiInstance = new EBirdApiClient()
  }
  return ebirdApiInstance
}

// Export a function to get the API instance instead of a direct instance
export const ebirdApi = {
  setApiKey: (apiKey: string) => {
    if (typeof window === 'undefined') return
    getEbirdApi().setApiKey(apiKey)
  },
  getNotableObservations: async (regionCode: string, options?: Partial<FilterOptions>) => {
    if (typeof window === 'undefined') throw new Error('API can only be used on client side')
    return getEbirdApi().getNotableObservations(regionCode, options)
  },
  validateApiKey: async () => {
    if (typeof window === 'undefined') return false
    return getEbirdApi().validateApiKey()
  },
}

export default EBirdApiClient 