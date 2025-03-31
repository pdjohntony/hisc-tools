import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

import { ToastProps } from "@/components/ui/toast";
import { useToast } from "@/components/ui/toast/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { h } from "vue";

const { toast } = useToast();

async function sendToastNotification(
  title: string,
  body: string | undefined,
  variant: ToastProps["variant"] = "default",
  actionText?: string,
  actionFn?: () => void
) {
  if (!actionText || !actionFn) {
    toast({ title, description: body, variant: variant });
    return;
  } else if (actionText && actionFn) {
    toast({
      title,
      description: body,
      variant: variant,
      action: h(
        ToastAction,
        {
          altText: actionText,
          onClick: actionFn,
        },
        {
          default: () => actionText,
        }
      ),
    });
    return;
  }
}

export default async function notify(
  title: string,
  body: string | undefined,
  variant: ToastProps["variant"] = "default",
  method: "os" | "app" = "app",
  actionText?: string,
  actionFn?: () => void
) {
  if (method === "app") {
    sendToastNotification(title, body, variant, actionText, actionFn);
    return;
  }

  let permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }

  if (permissionGranted) {
    sendNotification({ title, body });
  } else {
    sendToastNotification(title, body, variant, actionText, actionFn);
  }
}
