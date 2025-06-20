'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { FilterPanel } from '@/components/filter-panel'
import { Header } from '@/components/header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { FilterOptions, ApiKeyState } from '@/types/ebird'

// Dynamically import BirdMap to avoid SSR issues
const BirdMap = dynamic(() => import('@/components/bird-map').then(mod => ({ default: mod.BirdMap })), {
  ssr: false,
  loading: () => <LoadingSpinner />
})

/**
 * Default filter configuration
 */
const DEFAULT_FILTERS: FilterOptions = {
  regionCode: 'US',
  back: 14,
  detail: 'full',
  hotspot: false,
  sppLocale: 'en',
}

/**
 * Main application page component
 * Manages API key validation, filter state, and data fetching coordination
 */
export default function HomePage() {
  // API key state management
  const [apiKeyState, setApiKeyState] = useState<ApiKeyState>({
    apiKey: '',
    isValid: false,
  })
  
  // Filter state management
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>(DEFAULT_FILTERS)
  const [pendingFilters, setPendingFilters] = useState<FilterOptions>(DEFAULT_FILTERS)
  
  // Data fetching state
  const [shouldFetchData, setShouldFetchData] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  /**
   * Handle API key changes and validate the key
   */
  const handleApiKeyChange = async (apiKey: string) => {
    console.log('API key changed:', apiKey ? `${apiKey.substring(0, 8)}...` : 'empty')
    setApiKeyState({ apiKey, isValid: false, error: undefined })
    setMapLoaded(false) // Reset map loaded state when API key changes
    
    if (apiKey.trim()) {
      try {
        console.log('Setting API key and validating...')
        console.log('API key to validate:', apiKey)
        
        // Only use API on client side
        if (typeof window !== 'undefined') {
          // Import API client only on client side
          const { ebirdApi } = await import('@/lib/ebird-api')
          console.log('API client imported successfully')
          
          ebirdApi.setApiKey(apiKey)
          console.log('API key set, now validating...')
          
          const isValid = await ebirdApi.validateApiKey()
          console.log('API key validation result:', isValid)
          setApiKeyState({ apiKey, isValid, error: isValid ? undefined : 'Invalid API key' })
        } else {
          console.log('Not in browser environment, skipping API validation')
        }
      } catch (error) {
        console.error('API key validation error:', error)
        setApiKeyState({ 
          apiKey, 
          isValid: false, 
          error: error instanceof Error ? error.message : 'Failed to validate API key' 
        })
      }
    }
  }

  /**
   * Handle filter changes (updates pending filters)
   */
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setPendingFilters(newFilters)
    setShouldFetchData(false) // Reset fetch flag when filters change
  }

  /**
   * Apply pending filters and trigger data fetch
   */
  const handleApplyFilters = () => {
    setCurrentFilters(pendingFilters)
    setShouldFetchData(true)
    setMapLoaded(false) // Reset map loaded state when filters are applied
  }

  /**
   * Reset filters to default values
   */
  const handleResetFilters = () => {
    setPendingFilters(DEFAULT_FILTERS)
    setCurrentFilters(DEFAULT_FILTERS)
    setShouldFetchData(true)
    setMapLoaded(false) // Reset map loaded state when filters are reset
  }

  /**
   * Handle map loaded event
   */
  const handleMapLoaded = () => {
    setMapLoaded(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onApiKeyChange={handleApiKeyChange}
        currentApiKey={apiKeyState.apiKey}
      />
      
      <main className="flex h-[calc(100vh-4rem)]">
        {/* Filter Panel */}
        <aside className="w-80 border-r border-border bg-card p-4 overflow-y-auto">
          <FilterPanel 
            filters={pendingFilters}
            onFiltersChange={handleFiltersChange}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </aside>
        
        {/* Map Container */}
        <div className="flex-1 relative">
          <Suspense fallback={<LoadingSpinner />}>
            <BirdMap 
              filters={currentFilters}
              apiKey={apiKeyState.isValid ? apiKeyState.apiKey : undefined}
              shouldFetchData={shouldFetchData}
              onMapLoaded={handleMapLoaded}
            />
          </Suspense>
        </div>
      </main>

      {/* API Key Error Display */}
      {apiKeyState.error && !mapLoaded && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg max-w-md">
          <p className="text-sm font-medium">API Key Error</p>
          <p className="text-xs mt-1">{apiKeyState.error}</p>
          <p className="text-xs mt-2 opacity-75">
            Check the browser console for detailed error information.
          </p>
        </div>
      )}
    </div>
  )
} 