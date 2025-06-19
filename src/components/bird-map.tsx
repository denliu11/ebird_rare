'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Bird, MapPin, Calendar, User } from 'lucide-react'
import { EBirdSighting, FilterOptions, UserLocation } from '@/types/ebird'
import { ebirdApi } from '@/lib/ebird-api'
import { formatDate, formatDistance, getRarityColor, getInitialMapCenter } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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

// Custom marker icon
const createCustomIcon = (rarity: string) => {
  return new Icon({
    iconUrl: `/markers/${rarity}-marker.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/markers/marker-shadow.png',
    shadowSize: [41, 41],
  })
}

interface BirdMapProps {
  filters?: FilterOptions
  userLocation?: UserLocation
  apiKey?: string
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  
  return null
}

export function BirdMap({ filters, userLocation, apiKey }: BirdMapProps) {
  const [sightings, setSightings] = useState<EBirdSighting[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(getInitialMapCenter())
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude])
    }
  }, [userLocation])

  useEffect(() => {
    const fetchSightings = async () => {
      if (!filters || !apiKey) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Set the API key for this request
        ebirdApi.setApiKey(apiKey)
        
        // Fetch notable observations using the new API structure
        const data = await ebirdApi.getNotableObservations(filters.regionCode, filters)
        setSightings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sightings')
        console.error('Error fetching sightings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSightings()
  }, [filters, apiKey])

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMapCenter([latitude, longitude])
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('Unable to get your location')
        }
      )
    } else {
      setError('Geolocation is not supported by this browser')
    }
  }

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
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLocationClick}
          className="bg-white/90 backdrop-blur"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

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
        
        <MapUpdater center={mapCenter} />

        {/* Bird Sightings Markers */}
        {sightings.map((sighting) => (
          <MarkerDynamic
            key={sighting.subId}
            position={[sighting.lat, sighting.lng]}
            icon={createCustomIcon('rare')}
          >
            <PopupDynamic>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start space-x-2">
                  <Bird className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{sighting.comName}</h3>
                    <p className="text-xs text-muted-foreground italic">{sighting.sciName}</p>
                  </div>
                </div>
                
                <div className="mt-3 space-y-1 text-xs">
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
                
                <div className="mt-3 pt-2 border-t">
                  <Button size="sm" className="w-full">
                    View Details
                  </Button>
                </div>
              </div>
            </PopupDynamic>
          </MarkerDynamic>
        ))}
      </MapContainerDynamic>

      {/* Sightings Count */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium">
            {sightings.length} sighting{sightings.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>
    </div>
  )
} 