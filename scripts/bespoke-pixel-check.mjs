/** Decode actual browser screenshots without adding a PNG/image dependency. */
export async function pixelDifference(page, first, second) {
  return page.evaluate(async ([a, b]) => {
    async function pixels(encoded) {
      const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(encoded), c => c.charCodeAt(0))], { type: 'image/png' }));
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext('2d'); context.drawImage(bitmap, 0, 0); bitmap.close();
      return { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
    }
    const left = await pixels(a), right = await pixels(b);
    if (left.width !== right.width || left.height !== right.height) throw new Error('Pixel comparison needs equal rendered dimensions.');
    let changed = 0, sum = 0;
    for (let i = 0; i < left.data.length; i += 4) {
      const differences = [0, 1, 2].map(channel => Math.abs(left.data[i + channel] - right.data[i + channel]));
      if (Math.max(...differences) >= 12) changed++;
      sum += differences.reduce((a, b) => a + b, 0) / 3;
    }
    const count = left.width * left.height;
    return { width: left.width, height: left.height, changedFraction: changed / count, meanChannelDelta: sum / count };
  }, [first.toString('base64'), second.toString('base64')]);
}
