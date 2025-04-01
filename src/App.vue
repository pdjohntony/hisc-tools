<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getVersion } from '@tauri-apps/api/app'

import appState from '@/stores/appState'
import SettingsMenu from '@/components/SettingsMenu.vue'
import UpdaterDrawer from '@/components/UpdaterDrawer.vue'

import { HouseIcon } from 'lucide-vue-next'
import Toaster from '@/components/ui/toast/Toaster.vue'
import { Button } from '@/components/ui/button'

// States
const openUpdaterDrawer = ref(false)

onMounted(async () => {
  console.log('App mounted')

  appState.value.version = await getVersion()
  console.log('App version:', appState.value.version)
})
</script>

<template>
  <Toaster />
  <UpdaterDrawer v-model:open="openUpdaterDrawer" />
  <main class="p-6">
    <!-- Navbar -->
    <nav class="flex justify-between items-center mb-6">
      <div class="flex items-end gap-4">
        <RouterLink :to="{ name: 'home' }" as-child>
          <div
            class="flex items-center gap-4 cursor-pointer hover:text-primary/75 transition-colors duration-100"
          >
            <HouseIcon class="w-6 h-6" />
            <h1 class="text-2xl font-bold">HISC Tools</h1>
          </div>
        </RouterLink>
        <div class="flex gap-2 text-primary/50">
          <RouterLink :to="{ name: 'tool-lateclockins' }" activeClass="text-primary" as-child>
            <Button variant="ghost" size="xs">Late Clock Ins</Button>
          </RouterLink>
        </div>
      </div>
      <SettingsMenu @check-for-updates="openUpdaterDrawer = true" />
    </nav>

    <RouterView />
  </main>
</template>

<style>
@import './assets/main.css';
</style>
<style scoped></style>
