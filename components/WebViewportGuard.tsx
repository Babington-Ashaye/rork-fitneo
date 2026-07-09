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
      viewport.setAttribute("content", `${viewportContent}, interactive-widget=resizes-content`);
    }

    const style = document.createElement("style");
    style.setAttribute("data-fitneo-viewport-guard", "true");
    style.textContent = `
      html,
      body,
      #root {
        margin: 0;
        max-width: 100%;
        min-height: 100%;
        overflow-x: hidden;
        padding: 0;
        width: 100%;
      }

      body {
        background: #05070D;
        overscroll-behavior-x: none;
        position: relative;
      }

      input,
      textarea,
      select,
      button {
        outline: none;
        -webkit-tap-highlight-color: transparent;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      [data-expo-root],
      #root > div {
        max-width: 100dvw;
        overflow-x: hidden;
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
