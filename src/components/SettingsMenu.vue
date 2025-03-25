<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-vue-next";
import { useColorMode } from "@vueuse/core";

const mode = useColorMode();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" aria-label="Settings">
        <Menu />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent side="bottom" :side-offset="5" align="end">
      <DropdownMenuLabel>Settings</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <span>Theme</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem @click="mode = 'light'">
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="mode = 'dark'">
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="mode = 'auto'">
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
