// Load an image with progress: `onProgress(0..1)` follows the bytes received
// (an <img> reports none). Resolves with an object URL of the image, which
// shows at once because it is already in memory.
export async function fetchImage(href, onProgress, signal) {
  const res = await fetch(href, { signal });

  if(!res.ok) throw new Error(`image ${res.status}`);

  const total = Number(res.headers.get('content-length')) || 0;
  const parts = [];
  let got = 0;

  if(!res.body) parts.push(await res.blob());
  else
    for(const reader = res.body.getReader(); ; ) {
      const { done, value } = await reader.read();

      if(done) break;

      parts.push(value);
      got += value.length;

      if(total) onProgress?.(Math.min(1, got / total));
    }

  onProgress?.(1);

  return URL.createObjectURL(new Blob(parts, { type: res.headers.get('content-type') ?? undefined }));
}
