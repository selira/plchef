<template>
  <q-card style="min-width: 70%; align-self: center;">
    <q-card-section>
    </q-card-section>
    <q-separator />
    <q-select
      v-model="selectedYears"
      :options="yearOptions"
      option-label="title"
      option-value="value"
      label="Choose Decade/Years"
    >
    </q-select>
    <div class="row" v-if="selectedYears.value==='custom'">
      <div class="col-6">
        <q-input
          label="Start Year"
          v-model="startYear"
          :rules="[yearRule, requiredRule]"
          maxlength="4"
          :error="startYearError"
        ></q-input>
      </div>
      <div class="col-6">
        <q-input
          label="End Year"
          v-model="endYear"
          :rules="[yearRule, requiredRule, endYearGreaterThanStartYearRule]"
          maxlength="4"
          :error="endYearError"
        ></q-input>
      </div>
    </div>

    <q-card-section>
      <q-btn @click="searchSongs">Search Artist</q-btn>
      <q-btn @click="closeDialog">Cancel</q-btn>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useSpotifyRequests } from '../stores/requests'

const props = defineProps<{ artist: any }>()

const emit = defineEmits<{
  (e: 'closeDialog'): void
  (e: 'searchGenre', selection: any): void
}>()

const requestsStore = useSpotifyRequests()

const selectedYears = ref({value: 'all', title: 'All Years'}) as any
const yearOptions = [
  {title: "All Years", value: "all"},
  {title: "Custom Years", value: "custom"},
  {title: "2020's", value: '2020-2023'},
  {title: "2010's", value: '2010-2019'},
  {title: "2000's", value: '2000-2009'},
  {title: "1990's", value: '1990-1999'},
  {title: "1980's", value: '1980-1989'},
  {title: "1970's", value: '1970-1979'},
  {title: "1960's", value: '1960-1969'}
]
const startYear = ref('') as any
const endYear = ref('') as any
const startYearError = ref(false) as any
const endYearError = ref(false) as any

const yearRule = (year: string) => {
  const pattern = new RegExp('^(19|20)[0-9]{2}$')
  return pattern.test(year) || 'Choose a year between 1900 and 2099'
}

const requiredRule = (value: string) => !!value || 'Required'

const endYearGreaterThanStartYearRule = (endYear: string) => {
  return parseInt(endYear) >= parseInt(startYear.value) || 'End year must be greater than start year'
}

// onMounted(() => {
// })

async function searchSongs() {
  const years = formYears()
  const artist = props.artist
  const url = `https://api.spotify.com/v1/search?q=artist:"${artist.name}" year:"${years}"&type=track&limit=50`
  //RIP FUNCIONA PESIMO DE LA API
}

function closeDialog() {
  emit('closeDialog')
}

function formYears() {
  if (selectedYears.value.value === 'all') {
    return ''
  }
  if (selectedYears.value.value === 'custom') {
    return `${startYear.value}-${endYear.value}`
  }
  return selectedYears.value.value
}
</script>
  