import { useEffect } from "react";
import { useUiStore } from "../store/useUiStore";

export default function UiInit() {
  const { reduceMotion, highContrast } = useUiStore();

  useEffect(() => {
    document.documentElement.toggleAttribute(
      "data-reduce-motion",
      reduceMotion
    );
  }, [reduceMotion]);

  useEffect(() => {
    document.documentElement.toggleAttribute(
      "data-high-contrast",
      highContrast
    );
  }, [highContrast]);

  return null;
}
