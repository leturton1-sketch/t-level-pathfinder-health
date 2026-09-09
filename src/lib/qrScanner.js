let decoderPromise;
export async function decodeQrImage(source) {
  const width = source.videoWidth || source.width;
  const height = source.videoHeight || source.height;
  if (!width || !height) return null;
  const scale = Math.min(1, 1280 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image scanning is unavailable. Use PIN sign-in.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  decoderPromise ||= import("jsqr").then(module => module.default);
  const decode = await decoderPromise;
  return decode(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" })?.data || null;
}
