export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin, STORAGE_BUCKET, STORAGE_FOLDERS, type StorageFolder } from "@/lib/supabase";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as StorageFolder | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!folder || !Object.values(STORAGE_FOLDERS).includes(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    // Verify admin access for verifications folder
    if (folder === "verifications" && session.user.role !== "ADMIN" && session.user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = folder === "verifications"
      ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES]
      : ALLOWED_IMAGE_TYPES;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique path
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const path = `${folder}/${session.user.id}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL (for non-verification files)
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({
      url: urlData.publicUrl,
      path,
      folder,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
