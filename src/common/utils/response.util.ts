export function success(message: string, data?: any) {
  return {
    success: true,
    message,
    data,
  };
}
