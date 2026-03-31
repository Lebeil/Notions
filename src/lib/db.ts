import Dexie, { type EntityTable } from "dexie";

export interface Page {
  id: string;
  title: string;
  content: string; // JSON stringified BlockNote document
  parentId: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie("notions") as Dexie & {
  pages: EntityTable<Page, "id">;
};

db.version(1).stores({
  pages: "id, title, updatedAt",
});

db.version(2).stores({
  pages: "id, title, parentId, order, updatedAt",
}).upgrade((tx) => {
  return tx.table("pages").toCollection().modify((page) => {
    page.parentId = null;
    page.order = 0;
  });
});

export { db };
