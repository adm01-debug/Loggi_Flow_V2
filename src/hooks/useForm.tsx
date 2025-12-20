import { useState, useCallback, useMemo } from "react";
import { z } from "zod";

type ValidationErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormOptions<T> {
  initialValues: T;
  schema?: z.ZodSchema<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface FormState<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  schema,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
  });

  // Validate a single field
  const validateField = useCallback((name: keyof T, value: unknown): string | undefined => {
    if (!schema) return undefined;

    try {
      // Create a partial schema for single field validation
      const partialData = { ...state.values, [name]: value };
      schema.parse(partialData);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find((e) => e.path[0] === name);
        return fieldError?.message;
      }
      return undefined;
    }
  }, [schema, state.values]);

  // Validate all fields
  const validateAll = useCallback((): ValidationErrors<T> => {
    if (!schema) return {};

    try {
      schema.parse(state.values);
      return {};
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationErrors<T> = {};
        error.errors.forEach((e) => {
          if (e.path.length > 0) {
            const key = e.path[0] as keyof T;
            if (!errors[key]) {
              errors[key] = e.message;
            }
          }
        });
        return errors;
      }
      return {};
    }
  }, [schema, state.values]);

  // Handle field change
  const handleChange = useCallback((
    nameOrEvent: keyof T | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    value?: unknown
  ) => {
    let fieldName: keyof T;
    let fieldValue: unknown;

    if (typeof nameOrEvent === "object" && "target" in nameOrEvent) {
      fieldName = nameOrEvent.target.name as keyof T;
      fieldValue = nameOrEvent.target.type === "checkbox" 
        ? (nameOrEvent.target as HTMLInputElement).checked 
        : nameOrEvent.target.value;
    } else {
      fieldName = nameOrEvent;
      fieldValue = value;
    }

    setState((prev) => {
      const newValues = { ...prev.values, [fieldName]: fieldValue };
      const newErrors = validateOnChange 
        ? { ...prev.errors, [fieldName]: validateField(fieldName, fieldValue) }
        : prev.errors;

      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isDirty: true,
      };
    });
  }, [validateOnChange, validateField]);

  // Handle field blur
  const handleBlur = useCallback((
    nameOrEvent: keyof T | React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const fieldName = typeof nameOrEvent === "object" 
      ? nameOrEvent.target.name as keyof T 
      : nameOrEvent;

    setState((prev) => {
      const newTouched = { ...prev.touched, [fieldName]: true };
      const newErrors = validateOnBlur
        ? { ...prev.errors, [fieldName]: validateField(fieldName, prev.values[fieldName]) }
        : prev.errors;

      return {
        ...prev,
        touched: newTouched,
        errors: newErrors,
      };
    });
  }, [validateOnBlur, validateField]);

  // Set field value programmatically
  const setFieldValue = useCallback((name: keyof T, value: unknown) => {
    handleChange(name, value);
  }, [handleChange]);

  // Set field error programmatically
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  }, []);

  // Reset form
  const reset = useCallback((newValues?: T) => {
    setState({
      values: newValues || initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    });
  }, [initialValues]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors = validateAll();
    const isValid = Object.keys(errors).length === 0;

    // Mark all fields as touched
    const allTouched = Object.keys(state.values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Record<keyof T, boolean>
    );

    setState((prev) => ({
      ...prev,
      errors,
      touched: allTouched,
      isValid,
    }));

    if (!isValid || !onSubmit) return;

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await onSubmit(state.values);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [validateAll, onSubmit, state.values]);

  // Get field props helper
  const getFieldProps = useCallback((name: keyof T) => ({
    name: name as string,
    value: state.values[name] as string,
    onChange: handleChange,
    onBlur: handleBlur,
  }), [state.values, handleChange, handleBlur]);

  // Check if form is valid
  const isValid = useMemo(() => {
    const errors = validateAll();
    return Object.keys(errors).length === 0;
  }, [validateAll]);

  return {
    // State
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid,
    isDirty: state.isDirty,

    // Actions
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    reset,
    validateField,
    validateAll,
    getFieldProps,
  };
}

// Helper component for form fields
interface FieldProps {
  name: string;
  error?: string;
  touched?: boolean;
  children: React.ReactNode;
}

export function FormField({ name, error, touched, children }: FieldProps) {
  const showError = touched && error;
  
  return (
    <div className="space-y-1">
      {children}
      {showError && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
