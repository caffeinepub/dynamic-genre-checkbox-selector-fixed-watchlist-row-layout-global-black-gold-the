export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
}

export async function clearServiceWorkerCache() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    
    // Wait for confirmation or timeout
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 1000);

      navigator.serviceWorker.addEventListener('message', function handler(event) {
        if (event.data && event.data.type === 'CACHE_CLEARED') {
          clearTimeout(timeout);
          navigator.serviceWorker.removeEventListener('message', handler);
          resolve();
        }
      });
    });
  }
}
