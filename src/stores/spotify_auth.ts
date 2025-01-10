import { defineStore } from 'pinia';
import { useSpotifyRequests } from '../stores/requests'
import { useGenreDataStore } from './genre-data';

export const useSpotifyAuthStore = defineStore('spotifyAuth', {
  state: () => ({
    accessToken: '' as string,
    refreshToken: '' as string,
    isLoggedIn: false,
    codeVerifier: '' as string,
    expireTime: 0 as number,
    market: '' as string,
    clientId: '' as string,
    isPremium: false
  }),

  actions: {
    async login() {
      const codeVer = this.generateRandomString(128);

      this.generateCodeChallenge(codeVer).then(codeChallenge => {
        const state = this.generateRandomString(16);
        this.codeVerifier = codeVer

        const args = new URLSearchParams({
          response_type: 'code',
          client_id: this.clientId,
          scope: import.meta.env.VITE_SPOTIFY_SCOPE,
          redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
          state: state,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge
        });

        const spotifyUrl = 'https://accounts.spotify.com/authorize?' + args as any

        window.location = spotifyUrl;
      });
    },

    async logout() {
      this.accessToken = ''
      this.refreshToken = ''
      this.isLoggedIn = false
      this.market = ''
    },

    saveClientId(id: string) {
      this.clientId = id
    },

    async afterLoginCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if(code) {
        const args = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
          client_id: this.clientId,
          code_verifier: this.codeVerifier
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: args as any
        })
        if (!response.ok) {
          return
        }
        const responsejSON = await response.json();
        this.accessToken = responsejSON.access_token
        this.refreshToken = responsejSON.refresh_token
        this.isLoggedIn = true
        this.expireTime = Date.now() + responsejSON.expires_in * 1000
        this.setPremiumStatus()
        useGenreDataStore().favoritesLoaded = false

        // this.setMarket()
      }
    },

    async doRefreshToken() {
      const refreshToken = this.refreshToken
      if (!refreshToken) {
        return
      }
      const url = "https://accounts.spotify.com/api/token"

      const payload = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
        }),
      }
      const body = await fetch(url, payload)
      if (!body.ok) {
        // const response = await body.json()
        // alert('Internal error, Please logout and login again')
        return
      }
      const response = await body.json()
      this.accessToken = response.access_token
      this.refreshToken = response.refresh_token
      this.expireTime = Date.now() + response.expires_in * 1000
    },

    generateRandomString(length: number) {
      let text = '';
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    },

    async generateCodeChallenge(codeVerifier: string) {
      function base64encode(string: ArrayBuffer) {
        const intarray = new Uint8Array(string) as any
        return btoa(String.fromCharCode.apply(null, intarray))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
    
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest('SHA-256', data);
    
      return base64encode(digest);
    },

    async setMarket() {
      const requestsStore = useSpotifyRequests()
      const url = 'https://api.spotify.com/v1/me'
      const response = await requestsStore.getRequest(url)
      if (response.status !== 200) {
        return
      }
      this.market = response.data.country
    },

    async setPremiumStatus() {
      const requestsStore = useSpotifyRequests()
      const url = 'https://api.spotify.com/v1/me'
      const response = await requestsStore.getRequest(url)
      if (response.status !== 200) {
        return
      }
      this.isPremium = response.data.product === 'premium'
    }
  },
  persist: true
});
