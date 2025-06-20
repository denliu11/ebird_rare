'use client'

import { useState, useEffect } from 'react'
import { Suspense } from 'react'
import { BirdMap } from '@/components/bird-map'
import { FilterPanel } from '@/components/filter-panel'
import { Header } from '@/components/header'
import { LoadingSpinner } from '@/components/loading-spinner'
import { FilterOptions, ApiKeyState } from '@/types/ebird'
import { ebirdApi } from '@/lib/ebird-api'

export default function HomePage() {
  const [apiKeyState, setApiKeyState] = useState<ApiKeyState>({
    apiKey: '',
    isValid: false,
  })
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    regionCode: 'US',
    back: 14,
    detail: 'full',
    hotspot: false,
    sppLocale: 'en',
  })
  const [pendingFilters, setPendingFilters] = useState<FilterOptions>({
    regionCode: 'US',
    back: 14,
    detail: 'full',
    hotspot: false,
    sppLocale: 'en',
  })
  const [shouldFetchData, setShouldFetchData] = useState(false)

  const handleApiKeyChange = async (apiKey: string) => {
    console.log('API key changed:', apiKey ? `${apiKey.substring(0, 8)}...` : 'empty')
    setApiKeyState({ apiKey, isValid: false, error: undefined })
    
    if (apiKey.trim()) {
      try {
        console.log('Setting API key and validating...')
        ebirdApi.setApiKey(apiKey)
        const isValid = await ebirdApi.validateApiKey()
        console.log('API key validation result:', isValid)
        setApiKeyState({ apiKey, isValid, error: isValid ? undefined : 'Invalid API key' })
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

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setPendingFilters(newFilters)
    setShouldFetchData(false) // Reset fetch flag when filters change
  }

  const handleApplyFilters = () => {
    setCurrentFilters(pendingFilters)
    setShouldFetchData(true)
  }

  const handleResetFilters = () => {
    const defaultFilters: FilterOptions = {
      regionCode: 'US',
      back: 14,
      detail: 'full',
      hotspot: false,
      sppLocale: 'en',
    }
    setPendingFilters(defaultFilters)
    setCurrentFilters(defaultFilters)
    setShouldFetchData(true)
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
            />
          </Suspense>
        </div>
      </main>

      {/* API Key Error Display */}
      {apiKeyState.error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg max-w-md">
          <p className="text-sm font-medium">API Key Error</p>
          <p className="text-xs mt-1">{apiKeyState.error}</p>
          <p className="text-xs mt-2 opacity-75">
            Check the browser console for detailed error information.
          </p>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-4 bg-muted text-muted-foreground px-3 py-2 rounded text-xs">
          <p>API Key: {apiKeyState.apiKey ? 'Set' : 'Not set'}</p>
          <p>Valid: {apiKeyState.isValid ? 'Yes' : 'No'}</p>
          <p>Error: {apiKeyState.error || 'None'}</p>
          <p>Should Fetch: {shouldFetchData ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  )
} 