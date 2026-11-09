import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateIntegration } from "@/lib/api/integration-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authentication = await authenticateIntegration(request, "raffles:write");
  if ("error" in authentication) return NextResponse.json({ error: authentication.error }, { status: authentication.status });

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Rifa inválida" }, { status: 400 });

  const form = await request.formData();
  const image = form.get("image");
  if (!(image instanceof File)) return NextResponse.json({ error: "Debes enviar un archivo en el campo image" }, { status: 400 });
  if (!allowedTypes[image.type as keyof typeof allowedTypes]) return NextResponse.json({ error: "La imagen debe ser JPG, PNG o WebP" }, { status: 400 });
  if (image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "La imagen no puede superar 5 MB" }, { status: 400 });

  const admin = createAdminClient();
  const { data: raffle } = await admin.from("raffles").select("id,slug,organization_id").eq("id", id).eq("organization_id", authentication.context.organizationId).maybeSingle();
  if (!raffle) return NextResponse.json({ error: "Rifa no encontrada para esta integración" }, { status: 404 });

  const extension = allowedTypes[image.type as keyof typeof allowedTypes];
  const imagePath = `${raffle.id}/cover.${extension}`;
  const { error: uploadError } = await admin.storage.from("raffles").upload(imagePath, image, { contentType: image.type, upsert: true });
  if (uploadError) return NextResponse.json({ error: `No se pudo subir la imagen: ${uploadError.message}` }, { status: 400 });

  const { error: updateError } = await admin.from("raffles").update({ image_path: imagePath, updated_at: new Date().toISOString() }).eq("id", raffle.id).eq("organization_id", authentication.context.organizationId);
  if (updateError) return NextResponse.json({ error: `La imagen se subió, pero no se pudo asociar: ${updateError.message}` }, { status: 400 });

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/raffles/${imagePath}`;
  return NextResponse.json({ id: raffle.id, imagePath, imageUrl });
}
