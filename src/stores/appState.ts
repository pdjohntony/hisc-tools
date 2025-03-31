import { ref } from "vue";

interface AppState {
  version: string;
}

export default ref<AppState>({
  version: "",
});
