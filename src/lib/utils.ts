import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string from eBird API
 * @returns Formatted date string (e.g., "Dec 15, 2023, 02:30 PM")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get the initial map center coordinates (central US)
 * @returns [latitude, longitude] coordinates
 */
export function getInitialMapCenter(): [number, number] {
  // Default to a central US location
  return [39.8283, -98.5795]
} 