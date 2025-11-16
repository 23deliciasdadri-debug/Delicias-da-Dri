import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Images, Loader2, Upload, X, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export type ImagePickerItemStatus = 'idle' | 'pending' | 'uploading' | 'error';

export interface ImagePickerItem {
  id: string;
  url: string;
  status?: ImagePickerItemStatus;
  canSetAsCover?: boolean;
}

export interface ImagePickerProps {
  items: ImagePickerItem[];
  isDisabled?: boolean;
  maxItems?: number;
  emptyHint?: React.ReactNode;
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onReorder: (items: ImagePickerItem[]) => void;
  onSelectCover?: (item: ImagePickerItem) => void;
  coverUrl?: string | null;
}

const filterImageFiles = (files: File[]) => files.filter((file) => file.type.startsWith('image/'));

export const ImagePicker: React.FC<ImagePickerProps> = ({
  items,
  isDisabled,
  maxItems,
  emptyHint = 'Arraste imagens ou toque para enviar. Suporte a múltiplos arquivos.',
  onAddFiles,
  onRemove,
  onReorder,
  onSelectCover,
  coverUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDraggingOverZone, setIsDraggingOverZone] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );

  const hasReachedLimit = Boolean(maxItems && items.length >= maxItems);
  const isDropDisabled = Boolean(isDisabled || hasReachedLimit);

  const handleFilesSelection = useCallback(
    (files: FileList | File[]) => {
      if (isDropDisabled) {
        return;
      }
      const normalized = Array.isArray(files) ? files : Array.from(files ?? []);
      if (!normalized.length) {
        return;
      }
      const filtered = filterImageFiles(normalized);
      if (!filtered.length) {
        return;
      }
      const limited = maxItems ? filtered.slice(0, Math.max(0, maxItems - items.length)) : filtered;
      if (!limited.length) {
        return;
      }
      onAddFiles(limited);
    },
    [isDropDisabled, items.length, maxItems, onAddFiles],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelection(event.target.files ?? []);
    event.target.value = '';
  };

  const handleClickSelect = () => {
    if (isDropDisabled) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleDragOverZone = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isDropDisabled) {
      return;
    }
    setIsDraggingOverZone(true);
  };

  const handleDragLeaveZone = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOverZone(false);
  };

  const handleDropZone = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isDropDisabled) {
      return;
    }
    setIsDraggingOverZone(false);
    handleFilesSelection(event.dataTransfer.files);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered);
  };

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId),
    [activeId, items],
  );

  return (
    <div className="space-y-5">
      <div
        onDragEnter={handleDragOverZone}
        onDragOver={handleDragOverZone}
        onDragLeave={handleDragLeaveZone}
        onDrop={handleDropZone}
        className={cn(
          'rounded-2xl border-2 border-dashed p-6 text-center transition-all',
          isDropDisabled
            ? 'border-border/70 bg-muted/40 cursor-not-allowed'
            : 'cursor-pointer bg-card/70 hover:border-rose-300',
          isDraggingOverZone && !isDropDisabled ? 'border-rose-400 bg-rose-50/70' : '',
        )}
        role="button"
        tabIndex={0}
        onClick={handleClickSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClickSelect();
          }
        }}
        aria-disabled={isDropDisabled}
      >
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Images className="size-10 text-rose-500" aria-hidden />
          <p className="max-w-md">
            {hasReachedLimit
              ? 'Limite de imagens atingido. Remova alguma para enviar outra.'
              : emptyHint}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="outline" size="sm" disabled={isDropDisabled}>
              <Upload className="size-4" />
              Selecionar imagens
            </Button>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              ou solte arquivos aqui
            </span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
          capture="environment"
          disabled={isDropDisabled}
        />
      </div>

      {items.length ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {items.map((item) => {
                const canUseCoverAction =
                  Boolean(onSelectCover) &&
                  item.canSetAsCover !== false &&
                  (item.status === undefined || item.status === 'idle');
                return (
                  <SortableImageCard
                    key={item.id}
                    item={item}
                    disabled={isDisabled}
                    onRemove={() => onRemove(item.id)}
                    onSetCover={canUseCoverAction && onSelectCover ? () => onSelectCover(item) : undefined}
                    isCover={Boolean(coverUrl && item.url === coverUrl)}
                  />
                );
              })}
            </div>
          </SortableContext>
          {activeItem ? (
            <div className="pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-xl">
              <ImagePreviewContent item={activeItem} />
            </div>
          ) : null}
        </DndContext>
      ) : null}
    </div>
  );
};

interface SortableImageCardProps {
  item: ImagePickerItem;
  onRemove: () => void;
  disabled?: boolean;
  onSetCover?: () => void;
  isCover?: boolean;
}

const SortableImageCard: React.FC<SortableImageCardProps> = ({
  item,
  onRemove,
  disabled,
  onSetCover,
  isCover,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusLabel =
    item.status === 'uploading'
      ? 'Enviando...'
      : item.status === 'pending'
        ? 'Aguardando envio'
        : item.status === 'error'
          ? 'Erro ao enviar'
          : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all',
        isDragging ? 'ring-2 ring-rose-400' : 'hover:shadow-lg',
      )}
    >
      <ImagePreviewContent item={item} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      {isCover ? (
        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Capa atual
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 space-y-2 px-3 py-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1">
            <GripVertical className="size-4" />
            Arraste para ordenar
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            className="rounded-full bg-card/60 p-1 text-foreground shadow hover:bg-card/80"
            aria-label="Remover imagem"
          >
            <X className="size-4" />
          </button>
        </div>
        {onSetCover ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSetCover();
            }}
            className={cn(
              'w-full rounded-xl border border-card/40 bg-card/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-card/50',
              isCover ? 'border-primary bg-primary/15 text-primary' : '',
            )}
          >
            {isCover ? 'Capa selecionada' : 'Usar como capa'}
          </button>
        ) : null}
      </div>
      {statusLabel ? (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-black/60 px-3 py-2 text-xs font-semibold text-white">
          {item.status === 'uploading' ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          <span>{statusLabel}</span>
        </div>
      ) : null}
    </div>
  );
};

const ImagePreviewContent: React.FC<{ item: ImagePickerItem }> = ({ item }) => (
  <div className="aspect-square w-full bg-muted">
    <img
      src={item.url}
      alt="Pré-visualização da imagem"
      className="h-full w-full object-cover"
      loading="lazy"
      draggable={false}
    />
  </div>
);
