import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { supabase } from "./supabase";

const COLORS = [
  "#E06C75", "#61AFEF", "#98C379", "#E5C07B",
  "#C678DD", "#56B6C2", "#BE5046", "#D19A66",
];

function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface CollabResult {
  doc: Y.Doc;
  provider: { awareness: any };
  fragment: Y.XmlFragment;
}

/**
 * Minimal Yjs awareness implementation for BlockNote cursor rendering.
 */
class SimpleAwareness {
  private states = new Map<number, any>();
  private clientID: number;
  private listeners: Array<(changes: any) => void> = [];

  constructor(doc: Y.Doc) {
    this.clientID = doc.clientID;
  }

  getLocalState() {
    return this.states.get(this.clientID) ?? null;
  }

  setLocalStateField(field: string, value: any) {
    const current = this.states.get(this.clientID) ?? {};
    current[field] = value;
    this.states.set(this.clientID, current);
    this.listeners.forEach((fn) =>
      fn({ added: [], updated: [this.clientID], removed: [] })
    );
  }

  getStates() {
    return this.states;
  }

  on(_event: string, fn: any) {
    this.listeners.push(fn);
  }

  off(_event: string, fn: any) {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }

  destroy() {
    this.states.clear();
    this.listeners = [];
  }
}

export function useCollaboration(
  pageId: string | null,
  userName: string
) {
  const [ready, setReady] = useState(false);
  const resultRef = useRef<CollabResult | null>(null);

  useEffect(() => {
    if (!pageId) {
      resultRef.current = null;
      setReady(false);
      return;
    }

    const doc = new Y.Doc();
    const roomName = `notions-${pageId}`;
    const ORIGIN_REMOTE = "supabase-realtime";

    // 1. Local persistence
    const idb = new IndexeddbPersistence(`notions-yjs-${pageId}`, doc);

    // 2. Awareness for cursors
    const awareness = new SimpleAwareness(doc);
    awareness.setLocalStateField("user", {
      name: userName,
      color: pickColor(userName),
    });

    // 3. Supabase Realtime channel for cross-tab/cross-browser sync
    const channel = supabase.channel(roomName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "yjs-update" }, (payload) => {
        const update = new Uint8Array(payload.payload.update);
        Y.applyUpdate(doc, update, ORIGIN_REMOTE);
      })
      .subscribe();

    // Broadcast local changes
    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === ORIGIN_REMOTE) return;
      channel.send({
        type: "broadcast",
        event: "yjs-update",
        payload: { update: Array.from(update) },
      });
    };
    doc.on("update", onDocUpdate);

    resultRef.current = {
      doc,
      provider: { awareness },
      fragment: doc.getXmlFragment("blocknote"),
    };

    idb.once("synced", () => {
      setReady(true);
    });

    return () => {
      doc.off("update", onDocUpdate);
      supabase.removeChannel(channel);
      awareness.destroy();
      idb.destroy();
      doc.destroy();
      setReady(false);
    };
  }, [pageId, userName]);

  return ready ? resultRef.current : null;
}
