export const getAuthErrorMessage = (message: string): string => {
  const normalized = message.toLowerCase();

  if (normalized.includes('rate limit')) {
    return 'Email limit reached. Check your inbox or try again later.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email before signing in.';
  }

  return message;
};
