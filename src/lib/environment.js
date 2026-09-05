import { appParams } from "@/lib/app-params";

const isPlaceholder = (value) => !value || /^your[_-]|<.*>$/i.test(value.trim());

export function validateEnvironment() {
  const errors = [];
  const { appId, appBaseUrl } = appParams;

  if (isPlaceholder(appId)) {
    errors.push("VITE_BASE44_APP_ID is missing or still uses its placeholder value.");
  }

  if (appBaseUrl && !isPlaceholder(appBaseUrl)) {
    try {
      const url = new URL(appBaseUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.push("VITE_BASE44_APP_BASE_URL must use http or https.");
      }
    } catch {
      errors.push("VITE_BASE44_APP_BASE_URL must be a valid URL.");
    }
  } else if (appBaseUrl && isPlaceholder(appBaseUrl)) {
    errors.push("VITE_BASE44_APP_BASE_URL still uses its placeholder value.");
  }

  return { valid: errors.length === 0, errors };
}
