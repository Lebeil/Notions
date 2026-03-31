import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";

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
  provider: WebrtcProvider;
  fragment: Y.XmlFragment;
}

export function useCollaboration(
  pageId: string | null,
  userName: string
) {
  const [ready, setReady] = useState(false);
  const resultRef = useRef<CollabResult | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!pageId) {
      resultRef.current = null;
      setReady(false);
      return;
    }

    // Clean up previous session
    cleanupRef.current?.();

    const doc = new Y.Doc();
    const roomName = `notions-${pageId}`;

    // 1. Persist Yjs doc to IndexedDB (survives refresh)
    const idb = new IndexeddbPersistence(`notions-yjs-${pageId}`, doc);

    // 2. Cross-browser sync via WebRTC
    const webrtc = new WebrtcProvider(roomName, doc, {
      signaling: ["wss://signaling.yjs.dev"],
    });

    const color = pickColor(userName);
    webrtc.awareness.setLocalStateField("user", {
      name: userName,
      color,
    });

    // 3. Cross-tab sync via BroadcastChannel
    const bc = new BroadcastChannel(roomName);
    const ORIGIN_BC = "broadcast-channel";

    // Send local doc updates to other tabs
    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === ORIGIN_BC) return; // don't echo back
      bc.postMessage({ type: "yjs-update", update: Array.from(update) });
    };
    doc.on("update", onDocUpdate);

    // Receive updates from other tabs
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "yjs-update") {
        Y.applyUpdate(doc, new Uint8Array(e.data.update), ORIGIN_BC);
      }
    };
    bc.addEventListener("message", onMessage);

    resultRef.current = {
      doc,
      provider: webrtc,
      fragment: doc.getXmlFragment("blocknote"),
    };

    idb.once("synced", () => {
      setReady(true);
    });

    cleanupRef.current = () => {
      doc.off("update", onDocUpdate);
      bc.removeEventListener("message", onMessage);
      bc.close();
      webrtc.destroy();
      idb.destroy();
      doc.destroy();
      setReady(false);
    };

    return cleanupRef.current;
  }, [pageId, userName]);

  return ready ? resultRef.current : null;
}
