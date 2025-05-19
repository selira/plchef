<template>
  <q-page class="column items-center justify-evenly">
    <q-card v-if="!spotifyAuthStore.isLoggedIn">
      <q-card-section>
        <div class="text-h6">Set up your Spotify API Credentials:</div>
      </q-card-section>
      <q-card-section>
        <div> Sign in to Spotify on <a href="https://developer.spotify.com" target="_blank">developer.spotify.com</a>.</div>
        <div> Go to the API Dashboard (top right) and "Create app". </div>
        <div> Add "{{redirectUrl}}" to Redirect URIs. <q-btn square dense color="primary" icon="content_paste" @click="copyClip()" class="q-ml-sm" size="sm" /> </div>
        <div> Check Web API under "APIs used". </div>
        <div> Go to app settings (top right in dashboard view). </div>
        <div> Copy the app's "Client ID" into this form and click save. </div>
        <div> The ID is only stored locally in your browser. </div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="tempClientId"
          label="Client ID"
          dense
          type="password"
        >
        </q-input>
      </q-card-section>
      <q-card-actions align="left">
        <q-btn flat label="Save" color="primary" @click="saveClientId()"/>
      </q-card-actions>
    </q-card>
    <div v-if="!spotifyAuthStore.isLoggedIn">
      <!-- TODO: marketing lol-->
      <q-btn color="secondary" push @click="spotifyAuthStore.login" size="lg" no-caps :disable="spotifyAuthStore.clientId === ''">
        <div class="row items-center no-wrap">
          <q-icon
            name="img:icons/Spotify_Icon_RGB_Black.png"
            size="md"
            class='q-mr-md'
          />
          <div class="text-center">
            Login with Spotify
          </div>
        </div>
      </q-btn>
    </div>
  </q-page>
</template>

<script setup lang="ts">

import { ref } from 'vue'
import { useSpotifyAuthStore } from '../stores/spotify_auth'
import { useQuasar, copyToClipboard } from 'quasar'

const spotifyAuthStore = useSpotifyAuthStore()
const $q = useQuasar()

const tempClientId = ref(spotifyAuthStore.clientId)
const redirectUrl = ref(import.meta.env.VITE_SPOTIFY_REDIRECT_URI)


function saveClientId() {
  spotifyAuthStore.saveClientId(tempClientId.value)
  $q.notify('Client ID saved')
}

function copyClip() {
  copyToClipboard(redirectUrl.value)
  $q.notify(redirectUrl.value + ' copied to clipboard')
}
</script>

<style scoped>
a { 
  text-decoration:none; 
  color:#2097ff;
 } 
a:hover {
    text-decoration:none; 
    cursor:pointer;  
}
</style>