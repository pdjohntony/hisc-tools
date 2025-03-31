<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

import { check } from '@tauri-apps/plugin-updater'
import { type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

import appState from '@/stores/appState'

import { LoaderCircleIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer'
import { Progress } from '@/components/ui/progress'

// Props
const props = defineProps<{
  open: boolean
}>()

// Emits
const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
}>()

// States
const localOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const update = ref<Update | null>(null)
const updateStatus = ref({
  isDownloading: false,
  bytesTotal: 0,
  bytesDownloaded: 0,
  progress: 0,
  isDownloaded: false,
  isInstalling: false
})

onMounted(async () => {
  checkForNewVersion()
})

async function checkForNewVersion() {
  try {
    console.log('Checking for updates...')

    update.value = await check()

    if (update.value?.available) {
      console.log('Update available:', update.value)
      localOpen.value = true
    }
  } catch (error) {
    console.error('Error checking for updates:', error)
  }
}

async function downloadAndInstallUpdate() {
  if (update.value?.available) {
    await update.value.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          updateStatus.value.bytesTotal = event.data.contentLength ?? 0
          console.log(`Started downloading ${updateStatus.value.bytesTotal} bytes`)
          updateStatus.value.isDownloading = true
          break
        case 'Progress':
          updateStatus.value.bytesDownloaded += event.data.chunkLength
          updateStatus.value.progress = Math.round(
            (updateStatus.value.bytesDownloaded / updateStatus.value.bytesTotal) * 100
          )
          console.log(
            `Downloaded ${updateStatus.value.bytesDownloaded} out of ${updateStatus.value.bytesTotal} bytes (${updateStatus.value.progress}%)`
          )
          break
        case 'Finished':
          console.log('Download finished')
          updateStatus.value.isDownloading = false
          updateStatus.value.isDownloaded = true
          break
      }
    })

    updateStatus.value.isInstalling = true
    await relaunch()
  }
}
</script>

<template>
  <Drawer v-model:open="localOpen">
    <DrawerContent>
      <div class="mx-auto w-full max-w-xl">
        <template v-if="updateStatus.isInstalling">
          <DrawerHeader>
            <DrawerTitle>Installing update...</DrawerTitle>
            <DrawerDescription>Version {{ update?.version }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex px-4 items-center justify-center space-x-2">
            <LoaderCircleIcon class="w-12 h-12 animate-spin" />
          </div>
        </template>
        <template v-else-if="updateStatus.isDownloading">
          <DrawerHeader>
            <DrawerTitle>Downloading update...</DrawerTitle>
            <DrawerDescription>Version {{ update?.version }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex flex-col px-4 items-center justify-center space-x-2">
            <span class="mb-2 font-semibold">{{ updateStatus.progress }}%</span>
            <Progress :model-value="updateStatus.progress" class="!ml-0" />
          </div>
        </template>
        <template v-else-if="update?.available">
          <DrawerHeader>
            <DrawerTitle>App update available</DrawerTitle>
            <DrawerDescription>Version {{ update?.version }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex px-4 items-center justify-center space-x-2">
            <Button
              class="w-full bg-success text-primary hover:bg-success/80"
              @click="downloadAndInstallUpdate"
              >Install</Button
            >
          </div>
        </template>
        <template v-else>
          <DrawerHeader>
            <DrawerTitle>App is up to date</DrawerTitle>
            <DrawerDescription>Current Version {{ appState.version }}</DrawerDescription>
          </DrawerHeader>
        </template>
        <DrawerFooter>
          <DrawerClose>
            <Button v-if="!updateStatus.isInstalling" variant="secondary" class="w-full">
              {{ update?.available ? 'Cancel' : 'Close' }}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>
