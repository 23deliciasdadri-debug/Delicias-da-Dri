import type { ProductMedia } from '../types';
import { supabase } from '../lib/supabaseClient';

const PRODUCT_MEDIA_BUCKET = 'product-media';

export interface ProductMediaWithUrl extends ProductMedia {
  public_url: string;
}

const getPublicUrl = (path: string) =>
  supabase.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl ?? '';

const mapMediaRow = (row: ProductMedia): ProductMediaWithUrl => ({
  ...row,
  public_url: getPublicUrl(row.storage_path),
});

export async function listProductMedia(productId: string): Promise<ProductMediaWithUrl[]> {
  if (!productId) {
    return [];
  }
  const { data, error } = await supabase
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Erro ao carregar imagens do produto: ${error.message}`);
  }

  return (data ?? []).map((item) => mapMediaRow(item as unknown as ProductMedia));
}

const buildStoragePath = (productId: string, fileName: string) => {
  const sanitized =
    fileName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.-]/g, '')
      .replace(/-+/g, '-') || 'arquivo';
  const unique = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${productId}/${unique}-${sanitized}`;
};

export async function uploadProductMediaFile(
  productId: string,
  file: File,
  sortOrder: number,
): Promise<ProductMediaWithUrl> {
  const storagePath = buildStoragePath(productId, file.name || 'imagem.jpg');
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    throw new Error(`Erro ao enviar imagem: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from('product_media')
    .insert({
      product_id: productId,
      storage_path: storagePath,
      sort_order: sortOrder,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Erro ao registrar imagem do produto.');
  }

  return mapMediaRow(data as unknown as ProductMedia);
}

export async function deleteProductMediaRecord(id: number, storagePath?: string): Promise<void> {
  const { error } = await supabase.from('product_media').delete().eq('id', id);
  if (error) {
    throw new Error(`Erro ao remover imagem: ${error.message}`);
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .remove([storagePath]);
    if (storageError) {
      // eslint-disable-next-line no-console
      console.error('Erro ao remover arquivo do storage', storageError);
    }
  }
}

export async function reorderProductMedia(
  productId: string,
  items: Array<{ id: number; storage_path: string; sort_order: number }>,
): Promise<void> {
  if (!items.length) {
    return;
  }

  const payload = items.map((item) => ({
    ...item,
    product_id: productId,
  }));

  const { error } = await supabase.from('product_media').upsert(payload);
  if (error) {
    throw new Error(`Erro ao atualizar a ordem das imagens: ${error.message}`);
  }
}
