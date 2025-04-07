<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

import { getVersion } from '@tauri-apps/api/app'
import { check } from '@tauri-apps/plugin-updater'
import type { Update } from '@tauri-apps/plugin-updater'
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

let update: Update | null = null
const updateStatus = ref({
  checking: false,
  available: false,
  date: '',
  version: '',
  isDownloading: false,
  bytesTotal: 0,
  bytesDownloaded: 0,
  progress: 0,
  isDownloaded: false,
  isInstalling: false,
  errorMessage: ''
})

onMounted(async () => {
  appState.value.version = await getVersion()
  console.log('App version:', appState.value.version)
  checkForNewVersion()
})

async function onOpen(open: boolean) {
  if (open && !update?.available) {
    await checkForNewVersion()
  }
}

async function checkForNewVersion() {
  try {
    console.log('Checking for updates...')
    updateStatus.value.checking = true

    update = await check()

    if (update?.available) {
      console.log('Update available:', update)
      updateStatus.value.available = update.available
      updateStatus.value.date = update.date ?? ''
      updateStatus.value.version = update.version
      localOpen.value = true
    }
  } catch (error) {
    console.error('Error checking for updates:', error)
  } finally {
    updateStatus.value.checking = false
  }
}

async function downloadAndInstallUpdate() {
  try {
    if (update?.available) {
      await update.downloadAndInstall((event) => {
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
            updateStatus.value.progress = 0
            break
        }
      })

      updateStatus.value.isInstalling = true
      await relaunch()
    }
  } catch (error) {
    console.error('Update error:', error)
    updateStatus.value.errorMessage =
      (error as string) || 'Error downloading update. Please try again later.'
  } finally {
    updateStatus.value.isDownloading = false
    updateStatus.value.isDownloaded = true
    updateStatus.value.progress = 0
  }
}
</script>

<template>
  <Drawer v-model:open="localOpen" @update:open="onOpen">
    <DrawerContent>
      <div class="mx-auto w-full max-w-xl">
        <template v-if="updateStatus.isInstalling">
          <DrawerHeader>
            <DrawerTitle>Installing update...</DrawerTitle>
            <DrawerDescription>Version {{ updateStatus.version }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex px-4 items-center justify-center space-x-2">
            <LoaderCircleIcon class="w-12 h-12 animate-spin" />
          </div>
        </template>
        <template v-else-if="updateStatus.isDownloading">
          <DrawerHeader>
            <DrawerTitle>Downloading update...</DrawerTitle>
            <DrawerDescription>Version {{ updateStatus.version }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex flex-col px-4 items-center justify-center">
            <span class="mb-2 font-semibold">{{ updateStatus.progress }}%</span>
            <Progress :model-value="updateStatus.progress" />
          </div>
        </template>
        <template v-else-if="updateStatus.available">
          <DrawerHeader>
            <DrawerTitle>App update available</DrawerTitle>
            <DrawerDescription>Version {{ updateStatus.version }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex flex-col px-4 items-center justify-center gap-4">
            <span
              v-if="updateStatus.errorMessage"
              class="bg-destructive py-2 px-4 rounded-md text-sm w-full text-center"
              >{{ updateStatus.errorMessage }}</span
            >
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
          <div class="flex px-4 items-center justify-center space-x-2">
            <Button class="w-full" @click="checkForNewVersion" :disabled="updateStatus.checking"
              ><LoaderCircleIcon v-if="updateStatus.checking" class="w-4 h-4 animate-spin" />{{
                updateStatus.checking ? '' : 'Check for updates'
              }}</Button
            >
          </div>
        </template>
        <DrawerFooter>
          <DrawerClose>
            <Button v-if="!updateStatus.isInstalling" variant="secondary" class="w-full">
              {{ updateStatus.available ? 'Cancel' : 'Close' }}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>
