import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { playUISound } from "@/lib/uiSound";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const heardRef = useRef(new Set());

  useEffect(() => {
    const unseen = toasts.filter((item) => !heardRef.current.has(item.id));
    unseen.forEach((item) => {
      playUISound(item.variant === "destructive" ? "error" : item.sound || "notification");
      heardRef.current.add(item.id);
    });
    const visibleIds = new Set(toasts.map((item) => item.id));
    heardRef.current = new Set([...heardRef.current].filter((id) => visibleIds.has(id)));
  }, [toasts]);

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose onClick={() => dismiss(id)} aria-label="Dismiss notification" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
} 