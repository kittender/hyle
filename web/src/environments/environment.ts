export const environment = {
  apiBaseUrl: typeof window !== 'undefined'
    ? window.location.origin.replace(/:\d+/, ':3000')
    : 'http://localhost:3000'
};
