export const getCurrentLocation = (options?: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by this browser.'))
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied.'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable.'))
            break
          case error.TIMEOUT:
            reject(new Error('The request to get user location timed out.'))
            break
          default:
            reject(new Error('An unknown error occurred while getting location.'))
        }
      },
      options
    )
  })
}

export const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'YourAppName/1.0'
      }
    })
    const data = await res.json()
    return data.display_name || null
  } catch (err) {
    console.error('Reverse geocoding failed:', err)
    return null
  }
}
