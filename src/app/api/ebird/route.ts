import { NextRequest, NextResponse } from 'next/server'

const EBIRD_API_BASE = 'https://api.ebird.org/v2'

/**
 * Proxy API route for eBird API requests
 * Handles CORS issues and provides consistent error handling
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const apiKey = searchParams.get('apiKey')

  // Validate required parameters
  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint parameter is required' }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 })
  }

  try {
    // Construct the eBird API URL
    const url = new URL(`${EBIRD_API_BASE}${endpoint}`)
    
    // Copy all search params except endpoint and apiKey to the eBird API request
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint' && key !== 'apiKey') {
        url.searchParams.append(key, value)
      }
    })

    // Make request to eBird API
    const response = await fetch(url.toString(), {
      headers: {
        'X-eBirdApiToken': apiKey,
        'User-Agent': 'eBird-Rare-Alerts/1.0',
      },
    })

    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text()
      console.error('eBird API Error:', response.status, errorText)
      
      return NextResponse.json(
        { 
          error: `eBird API error: ${response.status} ${response.statusText}`,
          details: errorText
        }, 
        { status: response.status }
      )
    }

    // Return successful response
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from eBird API' }, 
      { status: 500 }
    )
  }
} 