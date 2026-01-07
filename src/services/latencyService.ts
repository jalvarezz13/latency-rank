/**
 * Measures the latency to a given URL.
 * Uses 'no-cors' mode to allow requests to opaque origins.
 * This measures TCP connect + TLS handshake + TTFB + Headers download time.
 */
export const measureLatency = async (url: string): Promise<number> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  const start = performance.now();
  
  // Ensure protocol is present
  const targetUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    // We use mode: 'no-cors' because we likely don't have permission to read the response.
    // However, the promise resolves when the headers are received.
    // cache: 'no-store' ensures we are hitting the network.
    await fetch(targetUrl, {
      method: 'GET', 
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    
    const end = performance.now();
    clearTimeout(timeoutId);
    return end - start;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`Failed to ping ${targetUrl}`, error);
    throw error;
  }
};
