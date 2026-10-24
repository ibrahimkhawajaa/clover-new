import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { newId } from "@/lib/ids";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
]);

export async function POST(req: Request) {
  try {
    await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("file required", 400);
    if (file.size > MAX_BYTES) return jsonError("File too large (max 8MB)", 400);
    if (!ALLOWED.has(file.type)) return jsonError("Unsupported file type", 400);

    const ext =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : file.type === "image/gif"
              ? "gif"
              : file.type.includes("ogg")
                ? "ogg"
                : file.type.includes("mpeg")
                  ? "mp3"
                  : file.type.includes("wav")
                    ? "wav"
                    : "webm";

    const name = `${newId("up")}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buf);

    return jsonOk({ path: `/uploads/${name}`, contentType: file.type });
  } catch (err) {
    return handleRouteError(err);
  }
}
