import { useCallback, useState } from 'react';

type MutationFn<TArgs, TResult> = (args: TArgs) => Promise<TResult>;

interface MutationResult<TArgs, TResult> {
  mutate: (args: TArgs) => Promise<TResult | undefined>;
  isMutating: boolean;
  error: string | null;
  reset: () => void;
}

export function useSupabaseMutation<TArgs = void, TResult = void>(
  mutationFn: MutationFn<TArgs, TResult>,
  opts?: {
    onSuccess?: (result: TResult) => void;
    onError?: (message: string) => void;
  },
): MutationResult<TArgs, TResult> {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (args: TArgs) => {
      setIsMutating(true);
      setError(null);
      try {
        const result = await mutationFn(args);
        opts?.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido ao salvar dados.';
        setError(message);
        opts?.onError?.(message);
        return undefined;
      } finally {
        setIsMutating(false);
      }
    },
    [mutationFn, opts],
  );

  const reset = () => setError(null);

  return { mutate, isMutating, error, reset };
}
