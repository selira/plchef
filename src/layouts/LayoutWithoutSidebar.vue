<template>
  <q-layout view="hhh lpr fff">
    <q-header class="bg-info text-white" height-hint="98">
      <q-toolbar>
        <q-toolbar-title @click="router.push('/')" style="text-overflow: clip;">
            <img
              src="icons/Logo.png"
              style="max-height: 58px; margin-bottom: -9px;"
              class="q-mt-sm"
            />
        </q-toolbar-title>
        <q-separator/>

        <q-btn flat label="Logout" @click="spotifySignOut" class="q-mr-md" v-if="spotifyAuthStore.isLoggedIn && !isMobile" />
        <q-btn flat icon="person" :label="isMobile ? '' : spotifyUsername" class="q-mr-md" v-if="spotifyAuthStore.isLoggedIn">
          <q-menu v-if="isMobile">
            <q-list>
              <q-item clickable @click="spotifySignOut">
                <q-item-section>
                  <q-item-label>Logout</q-item-label>
                  <q-item-label caption>{{ spotifyUsername }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-toggle
          :model-value="$q.dark.isActive"
          @update:model-value="setDarkMode"
          dense
          class="q-mr-sm"
          checked-icon="dark_mode"
          unchecked-icon="light_mode"
          color="black"
        />
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab to="/" :label="spotifyAuthStore.isLoggedIn ? 'Playlist' : 'Home'" />
        <q-route-tab to="/artists" label="Artists" v-if="spotifyAuthStore.isLoggedIn"/>
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view @playSong="playSong" @closePlayer="closePlayer"/>
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
// import { useSubscriptionsStore } from '../stores/subscription-store'
import { useSpotifyRequests } from '../stores/requests'
import { useSpotifyAuthStore } from '../stores/spotify_auth'
import { useLocalStorageStore } from '../stores/local-storage'
import { onMounted, ref, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// const subscriptionsStore = useSubscriptionsStore()
const router = useRouter()

const requestsStore = useSpotifyRequests()
const spotifyAuthStore = useSpotifyAuthStore()
const localStorageStore = useLocalStorageStore()

const spotifyUsername = ref('')
const spotifyId = ref('')

const isMobile = ref(false)


onMounted(() => {
  if (spotifyAuthStore.isLoggedIn) {
    loadSpotifyId()
  }
  window.addEventListener("resize", resizeListener)
  resizeListener()
})

onUnmounted(() => {
  window.removeEventListener("resize", resizeListener)
})

function resizeListener() {
  const width = window.innerWidth
  if (width < 1024) {
    isMobile.value = true
  } else {
    isMobile.value = false
  }
}

const emit = defineEmits<{
  (e: 'playSong', song: any, playerType: string, context: any): void
  (e: 'closePlayer'): void
}>()

async function spotifySignOut() {
  spotifyAuthStore.logout()
  // window.location.reload()
  router.push('/')
}

async function loadSpotifyId() {
  const url = 'https://api.spotify.com/v1/me'
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    // alert('Please sign in to spotify to view this page')
    // window.location.href = '/'
    if (response.status === 403) {
      spotifySignOut()
    }
    return
  }
  spotifyUsername.value = response.data.display_name
  spotifyId.value = response.data.id
}

function playSong(song: any, playerType: string, context = false) {
  emit('playSong', song, playerType, context)
}

function closePlayer() {
  emit('closePlayer')
}

function setDarkMode(mode: boolean) {
  $q.dark.set(mode)
  localStorageStore.darkMode = mode
}
</script>

<style>
.body--light {
  /* ... */
  background-color: #f5f5f5;
}

.body--dark {
  /* ... */
  background-color: #555555;
}
</style>