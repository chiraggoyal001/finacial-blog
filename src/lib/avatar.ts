import { supabase } from "./supabase";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const TARGET_SIZE = 256; // 256x256 pixels
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface ProcessImageResult {
  blob: Blob;
  url: string;
  error?: string;
}

/**
 * Validates and processes an image file
 * - Checks file size (max 5MB)
 * - Checks file type (images only)
 * - Resizes to 256x256 (maintaining aspect ratio, cropped to center)
 * - Converts to WebP format
 */
export async function processImage(file: File): Promise<ProcessImageResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      blob: new Blob(),
      url: "",
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      blob: new Blob(),
      url: "",
      error: "Only JPEG, PNG, WebP, and GIF images are allowed",
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve({
        blob: new Blob(),
        url: "",
        error: "Could not initialize canvas",
      });
      return;
    }

    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio and crop to center
      const { width, height } = img;
      let sx = 0;
      let sy = 0;
      let sWidth = width;
      let sHeight = height;

      // Calculate crop to make it square (center crop)
      if (width > height) {
        sx = (width - height) / 2;
        sWidth = height;
      } else if (height > width) {
        sy = (height - width) / 2;
        sHeight = width;
      }

      // Set canvas size to target
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;

      // Draw image cropped and resized
      ctx.drawImage(
        img,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        TARGET_SIZE,
        TARGET_SIZE
      );

      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
          } else {
            resolve({
              blob: new Blob(),
              url: "",
              error: "Failed to convert image to WebP",
            });
          }
        },
        "image/webp",
        0.85 // Quality (0-1)
      );
    };

    img.onerror = () => {
      resolve({
        blob: new Blob(),
        url: "",
        error: "Failed to load image",
      });
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      resolve({
        blob: new Blob(),
        url: "",
        error: "Failed to read file",
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads processed avatar to Supabase Storage
 * Returns the public URL of the uploaded avatar
 */
export async function uploadAvatar(
  userId: string,
  blob: Blob
): Promise<{ url?: string; error?: string }> {
  const filePath = `${userId}.webp`;

  // Delete existing avatar if any
  await deleteAvatar(userId);

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, blob, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const publicUrlWithBuster = `${publicUrl}?v=${Date.now()}`;

  // Update profile with new avatar URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrlWithBuster })
    .eq("id", userId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { url: publicUrlWithBuster };
}

/**
 * Deletes user's avatar from storage and clears the URL from profile
 */
export async function deleteAvatar(userId: string): Promise<{ error?: string }> {
  const filePath = `${userId}.webp`;

  // Try to delete from storage (ignore if doesn't exist)
  await supabase.storage.from("avatars").remove([filePath]);

  // Clear avatar_url from profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);

  if (updateError) {
    return { error: updateError.message };
  }

  return {};
}

/**
 * Gets the public URL for a user's avatar
 */
export function getAvatarUrl(userId: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(`${userId}.webp`);
  return publicUrl;
}
