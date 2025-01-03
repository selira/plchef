<template>
  <router-view @playSong="playSong"/>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue'
import { useLocalStorageStore } from './stores/local-storage'
import { useSpotifyRequests } from './stores/requests'
import { useQuasar } from 'quasar'

const localStorageStore = useLocalStorageStore()
const requestsStore = useSpotifyRequests()

const $q = useQuasar()

const recentlyPaused = ref(false)
const audioPlayerSongURI = ref('')

onMounted(async () => {
  $q.dark.set(localStorageStore.darkMode)
})

//// ??????? https://stackoverflow.com/a/49719812 https://github.com/vuejs/router/issues/366#issuecomment-1408501848
window.addEventListener('load', function() {
  window.history.pushState({current: '/'}, '')
})

async function playSong(song: any) {
  if (song.uri === audioPlayerSongURI.value && !recentlyPaused.value) {
    pauseSpotifyPlayer()
    return
  }
  if (true) {
    const playUrl = 'https://api.spotify.com/v1/me/player/play'
    let body = {
      // context_uri: song.artists[0]?.uri,
      uris: [song.uri]
    }
    const response = await requestsStore.putRequest(playUrl, body)
    if (!response.ok) {
      return
    }
  } else {
    const addItemToPlaybackQueueUrl = 'https://api.spotify.com/v1/me/player/queue?uri=' + song.uri
    const response = await requestsStore.postRequest(addItemToPlaybackQueueUrl, {}, false)
    if (response.status !== 200) {
      return
    }
    const skipToNextUrl = 'https://api.spotify.com/v1/me/player/next'
    const response2 = await requestsStore.postRequest(skipToNextUrl, {}, false)
    if (response2.status !== 200) {
      return
    }
  }
  audioPlayerSongURI.value = song.uri
  recentlyPaused.value = false
}

async function pauseSpotifyPlayer() {
  const pauseUrl = 'https://api.spotify.com/v1/me/player/pause'
  await requestsStore.putRequest(pauseUrl, {})
  recentlyPaused.value = true
}
</script>
