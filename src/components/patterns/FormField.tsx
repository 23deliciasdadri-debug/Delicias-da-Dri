import React from 'react';
import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

type RenderFn<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = (args: {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
}) => React.ReactNode;

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  render: RenderFn<TFieldValues, TName>;
}

/**
 * Wrapper para campos usando react-hook-form + Label + mensagens de erro.
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  required,
  className,
  labelClassName,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-2', className)}>
          {label ? (
            <Label className={cn('text-sm font-semibold', labelClassName)}>
              {label}
              {required ? <span className="text-rose-500">*</span> : null}
            </Label>
          ) : null}
          {render({ field, fieldState })}
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          {fieldState.error ? (
            <p className="text-xs font-medium text-destructive">{fieldState.error.message}</p>
          ) : null}
        </div>
      )}
    />
  );
}
