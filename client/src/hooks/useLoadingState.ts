import { useState } from "react";

export function useLoadingState(initial = false) {
  const [loading, setLoading] = useState(initial);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

  return {
    loading,
    startLoading,
    stopLoading,
    setLoading,
  };
}