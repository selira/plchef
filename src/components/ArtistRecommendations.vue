<template>
  <q-card style="align-self: center; max-width: 500px">
    <q-card-section>
      <div class="row">
        <div class="col-9 q-pa-md">
          <h6 class="q-py-md q-my-md">Recommendations based on {{ props.artist.name }}</h6>
        </div>
      </div>
      <div class="q-pa-md">
        <q-badge color="primary">
          Number of Songs: {{ numberOfSongs }}
        </q-badge>

        <q-slider v-model="numberOfSongs" :min="1" :max="100" />
      </div>
      <div class="q-pa-md row">
        <div class="col-6">
          <q-checkbox
            v-model="includesPopularity"
            label="Include Popularity"
          />
        </div>
        <div class="col-6">
          <q-badge color="primary">
            Target Popularity: {{ popularity }}
          </q-badge>

          <q-slider v-model="popularity" :min="0" :max="100" :disable="!includesPopularity"/>
        </div>
      </div>
    </q-card-section>
    <q-separator />
    

    <q-card-section>
      <q-btn @click="getRecommendations" color="primary" class="q-mr-sm">Select</q-btn>
      <q-btn @click="closeDialog" color="negative">Cancel</q-btn>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSpotifyRequests } from '../stores/requests'

const props = defineProps<{ artist: any }>()

const emit = defineEmits<{
  (e: 'closeDialog'): void
  (e: 'saveRecommendations', selection: any): void
}>()

const requestsStore = useSpotifyRequests()

const numberOfSongs = ref(20)
const includesPopularity = ref(false)
const popularity = ref(50)

// onMounted(() => {
// })

async function getRecommendations() {
  const artist = props.artist
  let url = `https://api.spotify.com/v1/recommendations?seed_artists=${artist.id}&limit=${numberOfSongs.value}`
  if (includesPopularity.value) {
    url += `&target_popularity=${popularity.value}`
  }
  const response = await requestsStore.getRequest(url, true)
  response.data.tracks.forEach((track: any) => {
    track.album = { id: track.album.id, images: track.album.images }
    delete track.available_markets
    delete track.disc_number
    delete track.explicit
    delete track.external_ids
    delete track.href
    delete track.is_local
    delete track.type
    delete track.track_number
  })
  emit('saveRecommendations', response.data.tracks)
}

function closeDialog() {
  emit('closeDialog')
}
</script>
  