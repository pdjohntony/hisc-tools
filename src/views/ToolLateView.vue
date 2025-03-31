<script setup lang="ts">
import FileUpload from "@/components/FileUpload.vue";
</script>

<template>
  <FileUpload
    :allowedFileTypes="[
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]"
  />
</template>
