'use client'

import { useState } from 'react'
import { Bird, MapPin, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Props for the Header component
 */
interface HeaderProps {
  onApiKeyChange?: (apiKey: string) => void
  currentApiKey?: string
}

/**
 * Application header component with API key management
 * Provides a clean interface for setting and updating the eBird API key
 */
export function Header({ onApiKeyChange, currentApiKey }: HeaderProps) {
  // Local state for managing API key input
  const [apiKey, setApiKey] = useState(currentApiKey || '')
  const [isExpanded, setIsExpanded] = useState(false)

  /**
   * Handle API key form submission
   */
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      onApiKeyChange?.(apiKey.trim())
      setIsExpanded(false)
    }
  }

  /**
   * Handle Enter key press in API key input
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApiKeySubmit(e as any)
    }
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bird className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">eBird Rare Alerts</h1>
          </div>
          <div className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Track rare bird sightings in your area</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isExpanded ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="flex items-center space-x-2"
            >
              <Key className="h-4 w-4" />
              <span>{currentApiKey ? 'Change API Key' : 'Add API Key'}</span>
            </Button>
          ) : (
            <form onSubmit={handleApiKeySubmit} className="flex items-center space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="apiKey" className="text-xs text-muted-foreground">
                  eBird API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-64 h-8 text-sm"
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" disabled={!apiKey.trim()}>
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsExpanded(false)
                  setApiKey(currentApiKey || '')
                }}
              >
                Cancel
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  )
} 