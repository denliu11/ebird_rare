'use client'

import { useState } from 'react'
import { Search, MapPin, Calendar, Filter, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FilterOptions } from '@/types/ebird'

interface FilterPanelProps {
  onFiltersChange?: (filters: FilterOptions) => void
}

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    regionCode: 'US',
    back: 14,
    detail: 'full',
    hotspot: false,
    sppLocale: 'en',
  })

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
      </div>

      {/* Region Code */}
      <div className="space-y-2">
        <Label htmlFor="regionCode">Region Code</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="regionCode"
            placeholder="e.g., US, US-NY, US-CA"
            value={filters.regionCode}
            onChange={(e) => handleFilterChange('regionCode', e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Country (US), State (US-NY), or County (US-NY-001) code
        </p>
      </div>

      {/* Days Back Filter */}
      <div className="space-y-2">
        <Label>Days Back (1-30)</Label>
        <Select
          value={filters.back.toString()}
          onValueChange={(value) => handleFilterChange('back', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="3">Last 3 days</SelectItem>
            <SelectItem value="7">Last week</SelectItem>
            <SelectItem value="14">Last 2 weeks</SelectItem>
            <SelectItem value="30">Last month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Detail Level */}
      <div className="space-y-2">
        <Label>Detail Level</Label>
        <Select
          value={filters.detail}
          onValueChange={(value) => handleFilterChange('detail', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hotspots Only */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="hotspot"
          checked={filters.hotspot}
          onChange={(e) => handleFilterChange('hotspot', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="hotspot">Hotspots only</Label>
      </div>

      {/* Max Results */}
      <div className="space-y-2">
        <Label htmlFor="maxResults">Max Results (1-10000)</Label>
        <Input
          id="maxResults"
          type="number"
          min="1"
          max="10000"
          placeholder="Leave empty for all results"
          value={filters.maxResults || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined
            handleFilterChange('maxResults', value)
          }}
        />
      </div>

      {/* Additional Locations */}
      <div className="space-y-2">
        <Label htmlFor="additionalLocations">Additional Locations</Label>
        <Input
          id="additionalLocations"
          placeholder="Comma-separated location codes"
          value={filters.r || ''}
          onChange={(e) => handleFilterChange('r', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Up to 10 additional location codes, comma-separated
        </p>
      </div>

      {/* Species Locale */}
      <div className="space-y-2">
        <Label>Species Language</Label>
        <Select
          value={filters.sppLocale}
          onValueChange={(value) => handleFilterChange('sppLocale', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="pt">Portuguese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button className="w-full" onClick={() => onFiltersChange?.(filters)}>
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            const defaultFilters: FilterOptions = {
              regionCode: 'US',
              back: 14,
              detail: 'full',
              hotspot: false,
              sppLocale: 'en',
            }
            setFilters(defaultFilters)
            onFiltersChange?.(defaultFilters)
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Region Codes:</strong></p>
        <p>• US - United States</p>
        <p>• US-NY - New York State</p>
        <p>• US-CA - California</p>
        <p>• US-NY-001 - Albany County, NY</p>
        <p>• L123456 - Specific location ID</p>
      </div>
    </div>
  )
} 