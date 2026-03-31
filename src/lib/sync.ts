import { supabase } from "./supabase";
import { db, type Page } from "./db";

export async function pullFromSupabase(): Promise<void> {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    console.error("Pull failed:", error.message);
    return;
  }

  if (!data || data.length === 0) return;

  const remoteParsed: Page[] = data.map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    parentId: row.parent_id,
    order: row.order,
    icon: row.icon || "",
    favorite: row.favorite || false,
    deleted: row.deleted || false,
    shareToken: row.share_token || null,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));

  for (const remote of remoteParsed) {
    const local = await db.pages.get(remote.id);
    if (!local || remote.updatedAt > local.updatedAt) {
      await db.pages.put(remote);
    }
  }
}

export async function pushToSupabase(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const localPages = await db.pages.toArray();
  if (localPages.length === 0) return;

  const rows = localPages.map((p) => ({
    id: p.id,
    user_id: user.id,
    title: p.title,
    content: p.content,
    parent_id: p.parentId,
    order: p.order,
    icon: p.icon || "",
    favorite: p.favorite || false,
    deleted: p.deleted || false,
    share_token: p.shareToken || null,
    created_at: new Date(p.createdAt).toISOString(),
    updated_at: new Date(p.updatedAt).toISOString(),
  }));

  const { error } = await supabase
    .from("pages")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Push failed:", error.message);
  }
}

export async function syncDeletedPages(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: remotePages } = await supabase
    .from("pages")
    .select("id");

  if (!remotePages) return;

  const localPages = await db.pages.toArray();
  const localIds = new Set(localPages.map((p) => p.id));
  const remoteIds = new Set(remotePages.map((p: any) => p.id));

  // Delete remote pages that no longer exist locally
  const toDeleteRemote = [...remoteIds].filter((id) => !localIds.has(id));
  if (toDeleteRemote.length > 0) {
    await supabase.from("pages").delete().in("id", toDeleteRemote);
  }
}

export async function fullSync(): Promise<void> {
  await pullFromSupabase();
  await pushToSupabase();
  await syncDeletedPages();
}
