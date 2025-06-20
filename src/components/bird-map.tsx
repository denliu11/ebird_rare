'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Bird, MapPin, Calendar, User, X, Code } from 'lucide-react'
import { formatDate, getInitialMapCenter } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EBirdSighting, FilterOptions, UserLocation } from '@/types/ebird'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainerDynamic = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })), {
  ssr: false,
})

const TileLayerDynamic = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })), {
  ssr: false,
})

const MarkerDynamic = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), {
  ssr: false,
})

const PopupDynamic = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), {
  ssr: false,
})

/**
 * Create a custom map pin icon using the provided SVG
 * @returns Leaflet Icon instance
 */
const createCustomIcon = () => {
  return new Icon({
    iconUrl: '/pin.svg',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

/**
 * Props for the BirdMap component
 */
interface BirdMapProps {
  filters?: FilterOptions
  userLocation?: UserLocation
  apiKey?: string
  shouldFetchData?: boolean
  onMapLoaded?: () => void
}

/**
 * Component to update map view when center or bounds change
 */
function MapUpdater({ center, bounds }: { center?: [number, number], bounds?: [[number, number], [number, number]] }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] })
    } else if (center) {
      map.setView(center, map.getZoom())
    }
  }, [center, bounds, map])
  
  return null
}

/**
 * Detailed view component for displaying comprehensive sighting information
 */
function DetailedSightingView({ sighting, onClose }: { sighting: EBirdSighting, onClose: () => void }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Sighting Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content area with scrollable details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Basic Information Section */}
        <div className="bg-muted p-3 rounded">
          <h4 className="font-medium mb-2">Basic Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Species:</span> {sighting.comName}</div>
            <div><span className="font-medium">Scientific:</span> {sighting.sciName}</div>
            <div><span className="font-medium">Location:</span> {sighting.locName}</div>
            <div><span className="font-medium">Date:</span> {formatDate(sighting.obsDt)}</div>
            <div><span className="font-medium">Observer:</span> {sighting.userDisplayName}</div>
            <div><span className="font-medium">Count:</span> {sighting.howMany || 'Not specified'}</div>
          </div>
        </div>

        {/* Coordinates Section */}
        <div className="bg-muted p-3 rounded">
          <h4 className="font-medium mb-2">Coordinates</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Latitude:</span> {sighting.lat}</div>
            <div><span className="font-medium">Longitude:</span> {sighting.lng}</div>
          </div>
        </div>

        {/* Validation Status Section */}
        <div className="bg-muted p-3 rounded">
          <h4 className="font-medium mb-2">Validation Status</h4>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs ${sighting.obsValid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {sighting.obsValid ? 'Valid' : 'Unvalidated'}
            </span>
            {sighting.obsReviewed && (
              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                Reviewed
              </span>
            )}
            {sighting.locationPrivate && (
              <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                Private Location
              </span>
            )}
          </div>
        </div>

        {/* Raw JSON Data Section */}
        <div className="bg-muted p-3 rounded">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Raw JSON Data</h4>
            <Code className="h-4 w-4" />
          </div>
          <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
            {JSON.stringify(sighting, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

/**
 * Main map component for displaying bird sightings
 * Handles data fetching, map rendering, and user interactions
 */
export function BirdMap({ filters, userLocation, apiKey, shouldFetchData = false, onMapLoaded }: BirdMapProps) {
  // State management
  const [sightings, setSightings] = useState<EBirdSighting[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(getInitialMapCenter())
  const [mapBounds, setMapBounds] = useState<[[number, number], [number, number]] | undefined>()
  const [selectedSighting, setSelectedSighting] = useState<EBirdSighting | null>(null)
  const mapRef = useRef<any>(null)

  /**
   * Calculate map bounds to fit all sightings with padding
   */
  const calculateMapBounds = (sightings: EBirdSighting[]) => {
    if (sightings.length === 0) return undefined

    const lats = sightings.map(s => s.lat)
    const lngs = sightings.map(s => s.lng)
    
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    
    // Add some padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1
    const lngPadding = (maxLng - minLng) * 0.1
    
    return [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding]
    ] as [[number, number], [number, number]]
  }

  /**
   * Calculate the center point of all sightings
   */
  const calculateMapCenter = (sightings: EBirdSighting[]) => {
    if (sightings.length === 0) return getInitialMapCenter()
    
    const avgLat = sightings.reduce((sum, s) => sum + s.lat, 0) / sightings.length
    const avgLng = sightings.reduce((sum, s) => sum + s.lng, 0) / sightings.length
    
    return [avgLat, avgLng] as [number, number]
  }

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude])
      setMapBounds(undefined)
    }
  }, [userLocation])

  // Fetch sightings data when filters, API key, or fetch flag changes
  useEffect(() => {
    const fetchSightings = async () => {
      if (!filters || !apiKey || !shouldFetchData) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Import API client only on client side
        const { ebirdApi } = await import('@/lib/ebird-api')
        
        // Set the API key for this request
        // Only use API on client side
        if (typeof window !== 'undefined') {
          ebirdApi.setApiKey(apiKey)
          
          // Fetch notable observations using the new API structure
          const data = await ebirdApi.getNotableObservations(filters.regionCode, filters)
          setSightings(data)
          
          // Calculate new center and bounds based on the data
          if (data.length > 0) {
            const newCenter = calculateMapCenter(data)
            const newBounds = calculateMapBounds(data)
            setMapCenter(newCenter)
            setMapBounds(newBounds)
          }
          
          // Notify parent that map has loaded
          onMapLoaded?.()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sightings')
        console.error('Error fetching sightings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSightings()
  }, [filters, apiKey, shouldFetchData, onMapLoaded])

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bird className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">API Key Required</p>
          <p className="text-sm text-muted-foreground">
            Please add your eBird API key in the header to view sightings.
          </p>
        </div>
      </div>
    )
  }

  // Don't render map until filters are applied
  if (!shouldFetchData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bird className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Ready to Search</p>
          <p className="text-sm text-muted-foreground">
            Configure your filters and click "Apply Filters" to view bird sightings.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bird sightings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Map Container */}
      <MapContainerDynamic
        ref={mapRef}
        center={mapCenter}
        zoom={10}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayerDynamic
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} bounds={mapBounds} />

        {/* Bird Sightings Markers */}
        {sightings.map((sighting) => (
          <MarkerDynamic
            key={sighting.subId}
            position={[sighting.lat, sighting.lng]}
            icon={createCustomIcon()}
          >
            <PopupDynamic>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start space-x-2">
                  <Bird className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{sighting.comName}</h3>
                    <p className="text-xs text-muted-foreground italic -mt-1">{sighting.sciName}</p>
                  </div>
                </div>
                
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(sighting.obsDt)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span>{sighting.locName}</span>
                  </div>
                  
                  {sighting.howMany && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Count: {sighting.howMany}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3" />
                    <span>{sighting.userDisplayName}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${sighting.obsValid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {sighting.obsValid ? 'Valid' : 'Unvalidated'}
                    </span>
                    {sighting.obsReviewed && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        Reviewed
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedSighting(sighting)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </PopupDynamic>
          </MarkerDynamic>
        ))}
      </MapContainerDynamic>

      {/* Detailed Sighting Modal */}
      {selectedSighting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl h-[90vh] overflow-hidden">
            <DetailedSightingView 
              sighting={selectedSighting} 
              onClose={() => setSelectedSighting(null)} 
            />
          </div>
        </div>
      )}
    </div>
  )
} 