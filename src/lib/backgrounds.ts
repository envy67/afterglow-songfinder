import dunes from "@/assets/bg-dunes.jpg";
import city from "@/assets/bg-city.jpg";
import jungle from "@/assets/bg-jungle.jpg";

export const PRESET_BACKGROUNDS = [
  { id: "dunes", label: "Dunes", src: dunes },
  { id: "city", label: "Rainy city", src: city },
  { id: "jungle", label: "Jungle", src: jungle },
] as const;

/** Shrinks an uploaded photo so it can be kept on this device. */
export async function compressImage(file: File, maxW = 1920): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxW / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
