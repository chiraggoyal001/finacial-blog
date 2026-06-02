import { supabase } from "./supabase";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const DEFAULT_MAX_WIDTH = 1200;
export const DEFAULT_QUALITY = 0.8;

/**
 * Compresses an image file:
 * - Checks file type
 * - Resizes the image to a maximum width (maintaining aspect ratio)
 * - Converts it to optimized WebP format
 */
export async function compressImage(
  file: File,
  maxWidth = DEFAULT_MAX_WIDTH,
  quality = DEFAULT_QUALITY
): Promise<Blob> {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not initialize canvas context"));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and resize image onto the canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas content to WebP blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image to WebP"));
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    // Read the file as data URL to trigger img.onload
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a compressed image to the Supabase Storage bucket
 * Returns the public URL of the uploaded image
 */
export async function uploadContentImage(
  file: File,
  folder = "general"
): Promise<string> {
  // Validate size
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`File size must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }

  // Compress image to WebP
  const compressedBlob = await compressImage(file);

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const filePath = `${folder}/${timestamp}-${randomStr}.webp`;

  // Upload to the 'content-images' bucket
  const { error: uploadError } = await supabase.storage
    .from("content-images")
    .upload(filePath, compressedBlob, {
      contentType: "image/webp",
      cacheControl: "31536000", // Cache for 1 year
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("content-images").getPublicUrl(filePath);

  return publicUrl;
}
