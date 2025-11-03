import { useSnackbar, VariantType } from "notistack";

/**
 * Custom hook for showing notifications
 * Provides consistent notification styling and behavior across the app
 */
export const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showNotification = (
    message: string,
    variant: VariantType = "default",
    options?: {
      persist?: boolean;
      action?: React.ReactNode;
    },
  ) => {
    return enqueueSnackbar(message, {
      variant,
      autoHideDuration: variant === "error" ? 5000 : 3000,
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
      ...options,
    });
  };

  return {
    success: (message: string, options?: { persist?: boolean; action?: React.ReactNode }) =>
      showNotification(message, "success", options),
    error: (message: string, options?: { persist?: boolean; action?: React.ReactNode }) =>
      showNotification(message, "error", options),
    warning: (message: string, options?: { persist?: boolean; action?: React.ReactNode }) =>
      showNotification(message, "warning", options),
    info: (message: string, options?: { persist?: boolean; action?: React.ReactNode }) =>
      showNotification(message, "info", options),
    close: closeSnackbar,
  };
};
