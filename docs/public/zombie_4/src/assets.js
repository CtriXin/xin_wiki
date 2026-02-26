export async function loadImages (imageMap) {
  const entries = Object.entries(imageMap);
  const results = await Promise.all(entries.map(async ([key, src]) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    try {
      await img.decode();
    } catch (_) {
      // decode 失败时保留 img 对象，后续按 complete 判断。
    }
    return [key, img];
  }));
  return Object.fromEntries(results);
}

export function imageReady (img) {
  return !!img && img.complete && img.naturalWidth > 0;
}
