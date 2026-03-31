import * as Y from "yjs";
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness";

/**
 * Syncs a Yjs document between tabs in the same browser
 * using the BroadcastChannel API.
 */
export class BroadcastProvider {
  private channel: BroadcastChannel;
  private doc: Y.Doc;
  awareness: Awareness;
  private destroyed = false;

  constructor(roomName: string, doc: Y.Doc) {
    this.doc = doc;
    this.channel = new BroadcastChannel(`notions-bc-${roomName}`);
    this.awareness = new Awareness(doc);

    // Listen for updates from other tabs
    this.channel.onmessage = (event) => {
      if (this.destroyed) return;
      const { type, data } = event.data;

      if (type === "doc-update") {
        Y.applyUpdate(this.doc, new Uint8Array(data), this);
      } else if (type === "awareness-update") {
        applyAwarenessUpdate(this.awareness, new Uint8Array(data), this);
      } else if (type === "sync-request") {
        // New tab requesting full state
        const state = Y.encodeStateAsUpdate(this.doc);
        this.channel.postMessage({
          type: "sync-response",
          data: Array.from(state),
        });
        // Also send awareness
        const awarenessUpdate = encodeAwarenessUpdate(
          this.awareness,
          Array.from(this.awareness.getStates().keys())
        );
        this.channel.postMessage({
          type: "awareness-update",
          data: Array.from(awarenessUpdate),
        });
      } else if (type === "sync-response") {
        Y.applyUpdate(this.doc, new Uint8Array(data), this);
      }
    };

    // Broadcast local updates to other tabs
    this.doc.on("update", (update: Uint8Array, origin: any) => {
      if (this.destroyed || origin === this) return;
      this.channel.postMessage({
        type: "doc-update",
        data: Array.from(update),
      });
    });

    // Broadcast awareness changes
    this.awareness.on("update", ({ added, updated, removed }: any) => {
      if (this.destroyed) return;
      const changedClients = [...added, ...updated, ...removed];
      const update = encodeAwarenessUpdate(this.awareness, changedClients);
      this.channel.postMessage({
        type: "awareness-update",
        data: Array.from(update),
      });
    });

    // Request full state from other tabs
    this.channel.postMessage({ type: "sync-request" });
  }

  destroy() {
    this.destroyed = true;
    this.awareness.destroy();
    this.channel.close();
  }
}
