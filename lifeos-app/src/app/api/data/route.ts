import { NextRequest, NextResponse } from "next/server";
import { clearUserCollectionRecords, clearUserRecords, createRecord, initializeUserData, isCollection, listRecords, removeRecord, removeRecords, replaceRecords, updateRecord } from "@/lib/server/database";
import { getRequestUser } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Please log in to load your records." }, { status: 401 });
  return NextResponse.json({ records: listRecords(user.id) });
}

export async function POST(request: NextRequest) {
  const user = getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Please log in to save records." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "The record request was not valid." }, { status: 400 });
  }

  const collection = typeof body.collection === "string" ? body.collection : "";
  if (!isCollection(collection)) return NextResponse.json({ error: "That record type is not available." }, { status: 400 });

  if (body.action === "create") {
    const item = body.item;
    if (!item || typeof item !== "object" || typeof (item as { id?: unknown }).id !== "string") {
      return NextResponse.json({ error: "A record ID is required." }, { status: 400 });
    }
    try {
      createRecord(user.id, collection, item as Record<string, unknown>);
      return NextResponse.json({ item });
    } catch {
      return NextResponse.json({ error: "Unable to create that record." }, { status: 409 });
    }
  }

  if (body.action === "update") {
    const id = typeof body.id === "string" ? body.id : "";
    const updates = body.updates;
    if (!id || !updates || typeof updates !== "object" || Array.isArray(updates)) {
      return NextResponse.json({ error: "A record ID and updates are required." }, { status: 400 });
    }
    const item = updateRecord(user.id, collection, id, updates as Record<string, unknown>);
    return item ? NextResponse.json({ item }) : NextResponse.json({ error: "That record no longer exists." }, { status: 404 });
  }

  if (body.action === "delete") {
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "A record ID is required." }, { status: 400 });
    return removeRecord(user.id, collection, id)
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "That record no longer exists." }, { status: 404 });
  }

  if (body.action === "delete-many") {
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
    removeRecords(user.id, collection, ids);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "replace") {
    const items = Array.isArray(body.items) ? body.items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && typeof (item as { id?: unknown }).id === "string") : [];
    replaceRecords(user.id, collection, items);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "clear") {
    clearUserCollectionRecords(user.id, collection);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "clear-all") {
    clearUserRecords(user.id);
    initializeUserData(user.id, user.displayName);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Choose a valid data action." }, { status: 400 });
}
