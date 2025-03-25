<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

import SettingsMenu from "./components/SettingsMenu.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const greetMsg = ref("");
const name = ref("");

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  greetMsg.value = await invoke("greet", { name: name.value });
}
</script>

<template>
  <main class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">HISC Late Clock Ins</h1>
      <SettingsMenu />
    </div>

    <form class="flex space-x-4 w-96 mx-auto mb-6" @submit.prevent="greet">
      <Input id="greet-input" v-model="name" placeholder="Enter a name..." />
      <Button type="submit">Greet</Button>
    </form>
    <p class="text-center">{{ greetMsg }}</p>
  </main>
</template>

<style>
@import "./assets/main.css";
</style>
<style scoped></style>
