import { useEffect } from "react";
import { Platform } from "react-native";

export function WebViewportGuard() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const viewport = document.querySelector<HTMLMetaElement>("meta[name='viewport']");
    const previousViewportContent = viewport?.getAttribute("content") ?? null;
    const viewportContent =
      previousViewportContent && previousViewportContent.length > 0
        ? previousViewportContent
        : "width=device-width, initial-scale=1, maximum-scale=1";
    if (viewport && !viewportContent.includes("interactive-widget")) {
      viewport.setAttribute("content", `${viewportContent}, viewport-fit=cover, interactive-widget=overlays-content`);
    }

    const style = document.createElement("style");
    style.setAttribute("data-fitneo-viewport-guard", "true");
    style.textContent = `
      html,
      body,
      #root {
        background: #000000;
        height: 100dvh;
        margin: 0;
        max-height: 100dvh;
        max-width: 100%;
        min-height: 100dvh;
        overflow: hidden !important;
        padding: 0;
        touch-action: manipulation;
        width: 100dvw;
      }

      body {
        background: #000000;
        overscroll-behavior: none;
        position: fixed;
        inset: 0;
      }

      :root {
        --fitneo-safe-top: max(16px, env(safe-area-inset-top));
        --fitneo-safe-bottom: max(16px, env(safe-area-inset-bottom));
      }

      input,
      textarea,
      select,
      button {
        background-color: #121214;
        color: #ffffff;
        font-size: 16px !important;
        outline: none;
        -webkit-tap-highlight-color: transparent;
      }

      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      textarea:-webkit-autofill,
      select:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 1000px #121214 inset !important;
        -webkit-text-fill-color: #ffffff !important;
        caret-color: #ffffff;
        transition: background-color 9999s ease-in-out 0s;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      [data-expo-root],
      #root > div {
        height: 100dvh;
        max-height: 100dvh;
        max-width: 100dvw;
        min-height: 100dvh;
        overflow: hidden !important;
        width: 100dvw;
      }
    `;

    document.head.appendChild(style);
    return () => {
      if (viewport) {
        if (previousViewportContent) {
          viewport.setAttribute("content", previousViewportContent);
        } else {
          viewport.removeAttribute("content");
        }
      }
      style.remove();
    };
  }, []);

  return null;
}



