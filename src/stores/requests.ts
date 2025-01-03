import { defineStore } from 'pinia'
import { useSpotifyAuthStore } from './spotify_auth'

interface RequestResults {
  [key: string]: any
}

export const useSpotifyRequests = defineStore('spotifyRequests', {
  state: () => ({
    requestResults: {} as RequestResults,
  }),
  getters: {
    getStoredRequest: (state) => {
      return (url: string) => {
        if (state.requestResults.hasOwnProperty(url)) {
          return state.requestResults[url]
        } else {
          return null
        }
      }
    }
  },
  actions: {
    async getRequest(url: string, withoutCache = false): Promise<any> {
      if (!withoutCache) {
        const data = this.getStoredRequest(url)
        if (data) {
          return { data, status: 200, cached: true, ok: true }
        }
      }
      const spotifyAuthStore = useSpotifyAuthStore()
      if (Date.now() > spotifyAuthStore.expireTime) {
        await spotifyAuthStore.doRefreshToken()
      }
      if (spotifyAuthStore.market === '' && url !== 'https://api.spotify.com/v1/me') {
        await spotifyAuthStore.setMarket()
      }
      const accessToken = spotifyAuthStore.accessToken
      const response = await fetch(url, {
        headers: {
          Authorization: 'Bearer ' + accessToken
        }
      })
      if (response.ok) {
        const data = await response.json()
        this.requestResults[url] = data
        return { data, status: response.status, ok: true }
      } else if (response.status === 401) {
        // Token expired
        await spotifyAuthStore.doRefreshToken()
        const accessToken = spotifyAuthStore.accessToken
        const response = await fetch(url, {
          headers: {
            Authorization: 'Bearer ' + accessToken
          }
        })
        if (response.ok) {
          const data = await response.json()
          this.requestResults[url] = data
          return { data, status: response.status, ok: true }
        } else {
          // Refresh token failed
          const data = await response.json()
          alert('Authentication failed, Please Logout and Login')
          return { error: 'Refresh token failed', data, status: response.status, ok: false }
        }
      } else if (response.status === 429) {
        // Too many requests, Exceeded rate limit
        const data = await response.json()
        alert('Too many requests, Try Again in a few moments')
        return { error: 'Too many requests', data, status: 429, ok: false }
      } else if (response.status === 403) {
        // Forbidden, No access, means that the spotify API is not accesible to user.
        spotifyAuthStore.logout()
        window.location.reload()
      } else {
        const data = await response.json()
        alert('Internal error, Please try again later')
        return { error: 'Unknown error', data, status: response.status, ok: false }
      }
    },

    async postRequest(url: string, body: any, processResponse = true): Promise<any> {
      const spotifyAuthStore = useSpotifyAuthStore()
      if (Date.now() > spotifyAuthStore.expireTime) {
        await spotifyAuthStore.doRefreshToken()
      }
      if (spotifyAuthStore.market === '') {
        await spotifyAuthStore.setMarket()
      }
      const accessToken = spotifyAuthStore.accessToken
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      if (response.ok) {
        if (!processResponse) {
          return { status: response.status, ok: true }
        }
        const data = await response.json()
        return { data, status: response.status }
      } else if (response.status === 401) {
        // Token expired
        await spotifyAuthStore.doRefreshToken()
        const accessToken = spotifyAuthStore.accessToken
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
        if (response.ok) {
          if (!processResponse) {
            return { status: response.status, ok: true }
          }
          const data = await response.json()
          return { data, status: response.status, ok: true }
        } else {
          // Refresh token failed
          const data = await response.json()
          alert('Authentication failed, Please Logout and Login')
          return { error: 'Refresh token failed', data, status: response.status, ok: false }
        }
      } else if (response.status === 429) {
        // Too many requests, Exceeded rate limit
        const data = await response.json()
        alert('Too many requests, Try Again in a few moments')
        return { error: 'Too many requests', data, status: 429, ok: false }
      } else if (response.status === 404 && url.includes('https://api.spotify.com/v1/me/player/')) {
        // Not found if player is not active
        alert('Activate your spotify player by playing a song.')
        return { error: 'Player not active', status: 404, ok: false }
      } else {
        const data = await response.json()
        alert('Internal error, Please try again later')
        return { error: 'Unknown error', data, status: response.status, ok: false }
      }
    },

    async putRequest(url: string, body: any): Promise<any> {
      const spotifyAuthStore = useSpotifyAuthStore()
      if (Date.now() > spotifyAuthStore.expireTime) {
        await spotifyAuthStore.doRefreshToken()
      }
      if (spotifyAuthStore.market === '') {
        await spotifyAuthStore.setMarket()
      }
      const accessToken = spotifyAuthStore.accessToken
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      if (response.ok) {
        return { status: response.status, ok: true }
      } else if (response.status === 401) {
        // Token expired
        await spotifyAuthStore.doRefreshToken()
        const accessToken = spotifyAuthStore.accessToken
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
        if (response.ok) {
          return { status: response.status, ok: true }
        } else {
          // Refresh token failed
          const data = await response.json()
          alert('Authentication failed, Please Logout and Login')
          return { error: 'Refresh token failed', data, status: response.status, ok: false }
        }
      } else if (response.status === 429) {
        // Too many requests, Exceeded rate limit
        const data = await response.json()
        alert('Too many requests, Try Again in a few moments')
        return { error: 'Too many requests', data, status: 429, ok: false }
      } else if (response.status === 404 && url.includes('https://api.spotify.com/v1/me/player/')) {
        // Not found if player is not active
        alert('Activate your spotify player by playing a song.')
        return { error: 'Player not active', status: 404, ok: false }
      } else {
        const data = await response.json()
        alert('Internal error, Please try again later')
        return { error: 'Unknown error', data, status: response.status, ok: false }
      }
    },

    async tryRefreshToken() {
      const spotifyAuthStore = useSpotifyAuthStore()
      if (Date.now() > spotifyAuthStore.expireTime) {
        await spotifyAuthStore.doRefreshToken()
      }
    }
  },
})