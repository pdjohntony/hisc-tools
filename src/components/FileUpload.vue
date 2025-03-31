<script setup lang="ts">
import { ref } from "vue";
import { UploadIcon, AlertCircleIcon } from "lucide-vue-next";

// Props
interface Props {
  allowedFileTypes?: string[];
  allowMultipleFiles?: boolean;
}
const props = defineProps<Props>();
const allowedFileTypes = props.allowedFileTypes || ["*"];
const allowMultipleFiles = props.allowMultipleFiles || false;

// Emits
const emit = defineEmits<{
  (e: "files-processed", files: FileList): void;
}>();

// States
const fileInput = ref<HTMLInputElement | null>(null);

let fileDropZoneHover = ref(false);
let fileDropZoneInvalid = ref(false);
let hoverInactiveTimeout: number | null = null;

function triggerFileSelect() {
  console.log("triggerFileSelect");
  fileInput.value?.click();
}

function setFileDropZoneActive() {
  // console.log("setFileDropZoneActive");
  fileDropZoneHover.value = true;
  fileDropZoneInvalid.value = false;

  if (hoverInactiveTimeout) {
    clearTimeout(hoverInactiveTimeout);
  }
}

function setFileDropZoneInactive() {
  // console.log("setFileDropZoneInactive");
  hoverInactiveTimeout = window.setTimeout(() => {
    fileDropZoneHover.value = false;
  }, 50);
}

function isFileAllowed(file: File): boolean {
  // console.log("isFileAllowed", file);
  if (allowedFileTypes.includes("*")) {
    return true;
  }
  return allowedFileTypes.some((type) => file.type === type);
}

function validateFiles(files: FileList): boolean {
  // console.log("validateFiles", files);
  for (let i = 0; i < files.length; i++) {
    if (!isFileAllowed(files[i])) {
      console.log("Invalid file type(s)");
      return false;
    }
  }
  console.log("Valid file type(s)");
  return true;
}

function onFileDrop(event: DragEvent) {
  console.log("onFileDrop", event);
  fileDropZoneHover.value = false;

  const files = event.dataTransfer?.files;
  console.log(files);

  if (!files || files.length === 0) {
    return;
  }

  if (validateFiles(files)) {
    fileDropZoneInvalid.value = false;
    emit("files-processed", files);
  } else {
    fileDropZoneInvalid.value = true;
  }
}

function onFileSelect(event: Event) {
  console.log("onFileSelect", event);
  const target = event.target as HTMLInputElement;
  const files = target.files;
  console.log(files);

  if (!files || files.length === 0) {
    return;
  }

  if (validateFiles(files)) {
    fileDropZoneInvalid.value = false;
    emit("files-processed", files);
  } else {
    fileDropZoneInvalid.value = true;
  }
}
</script>

<template>
  <div
    :data-hover="fileDropZoneHover"
    :data-invalid-file="fileDropZoneInvalid"
    @dragenter.prevent="setFileDropZoneActive"
    @dragover.prevent="setFileDropZoneActive"
    @dragleave.prevent="setFileDropZoneInactive"
    @drop.prevent="onFileDrop"
    @click="triggerFileSelect"
    :class="[
      'p-6 text-center rounded-lg hover:bg-muted/70 transition-colors duration-200 cursor-pointer',
      fileDropZoneHover ? 'bg-muted/70' : 'bg-muted/50',
    ]"
  >
    <input
      type="file"
      class="hidden"
      ref="fileInput"
      @change="onFileSelect"
      :accept="allowedFileTypes.join(',')"
      :multiple="allowMultipleFiles"
    />
    <template v-if="fileDropZoneInvalid">
      <AlertCircleIcon class="w-14 h-14 mx-auto my-4 text-red-500" />
      <p>Invalid file type(s)</p>
    </template>
    <template v-else>
      <UploadIcon
        :class="[
          'w-14 h-14 mx-auto my-4 text-neutral-500',
          fileDropZoneHover ? 'animate-bounce' : '',
        ]"
      />
      <p>
        {{
          fileDropZoneHover
            ? "Drop files here"
            : "Drag and drop files here, or click to select files"
        }}
      </p>
    </template>
  </div>
</template>
