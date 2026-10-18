import { getDb, schema } from "@/db";

/** Файл хадгалах нэгдсэн интерфейс. Өөр хадгалалт (S3, Supabase Storage) нэмэхдээ энэ интерфейсийг хэрэгжүүлнэ. */
export interface MediaStorage {
  save(data: Buffer, mime: string, ownerId: string | null): Promise<string>;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_IMAGE_BYTES = 1_500_000;

class DatabaseStorage implements MediaStorage {
  async save(data: Buffer, mime: string, ownerId: string | null) {
    const db = await getDb();
    const [row] = await db.insert(schema.media).values({ mime, data, ownerId }).returning({ id: schema.media.id });
    return `/media/${row.id}`;
  }
}

export const storage: MediaStorage = new DatabaseStorage();

/** FormData доторх зургийг шалгаж хадгална. Буруу төрөл эсвэл хэт том файлыг null болгоно. */
export async function saveUpload(file: File | null | undefined, ownerId: string | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!ALLOWED.has(file.type) || file.size > MAX_IMAGE_BYTES) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  return storage.save(buf, file.type, ownerId);
}
