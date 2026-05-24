import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./client";

export function useApiData<T>(path: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isLive, setLive] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(() => {
    setError("");
    apiRequest<T>(path)
      .then((payload) => {
        setData(payload);
        setLive(true);
      })
      .catch((reason) => {
        setLive(false);
        setError(reason instanceof Error ? reason.message : "Сервис временно недоступен");
      });
  }, [path]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, setData, isLive, error, refetch };
}
