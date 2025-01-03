<template>
  <q-card style="min-width: 70%; align-self: center;">
    <q-card-section>
      <div class="row">
        <div class="col-9 q-pa-md">
          <h6>Automatic Recommendations</h6>
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
      <q-btn @click="save" color="primary" class="q-mr-sm">Save</q-btn>
      <q-btn @click="closeDialog" color="negative">Cancel</q-btn>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'closeDialog'): void
  (e: 'saveRecommendations', numberOfSongs: number, popularity: number | null): void
}>()

const props = defineProps<{ automaticRecommendationsNumberOfSongs: number, automaticRecommendationsPopularity: number | null}>()

onMounted(() => {
  numberOfSongs.value = props.automaticRecommendationsNumberOfSongs
  if (props.automaticRecommendationsPopularity) {
    includesPopularity.value = true
    popularity.value = props.automaticRecommendationsPopularity
  }
})

const numberOfSongs = ref(20)
const includesPopularity = ref(false)
const popularity = ref(50)

async function save() {
  emit('saveRecommendations', numberOfSongs.value, includesPopularity.value ? popularity.value : null)
}

function closeDialog() {
  emit('closeDialog')
}
</script>
  