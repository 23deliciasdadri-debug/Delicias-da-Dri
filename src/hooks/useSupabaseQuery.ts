import { useCallback, useEffect, useState, type DependencyList } from 'react';

interface UseSupabaseQueryOptions<T> {
  enabled?: boolean;
  initialData?: T;
  deps?: DependencyList;
}

export function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  { enabled = true, initialData, deps = [] }: UseSupabaseQueryOptions<T> = {},
) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar dados.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, fetcher]);

  useEffect(() => {
    void execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, ...deps]);

  return {
    data,
    isLoading,
    error,
    refetch: execute,
  };
}
