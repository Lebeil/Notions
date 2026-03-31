import Dexie, { type EntityTable } from "dexie";

export interface Page {
  id: string;
  title: string;
  content: string; // JSON stringified BlockNote document
  parentId: string | null;
  order: number;
  icon: string;
  favorite: boolean;
  deleted: boolean;
  shareToken: string | null;
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

db.version(3).stores({
  pages: "id, title, parentId, order, favorite, deleted, updatedAt",
}).upgrade((tx) => {
  return tx.table("pages").toCollection().modify((page) => {
    page.icon = "";
    page.favorite = false;
    page.deleted = false;
  });
});

db.version(4).stores({
  pages: "id, title, parentId, order, favorite, deleted, shareToken, updatedAt",
}).upgrade((tx) => {
  return tx.table("pages").toCollection().modify((page) => {
    page.shareToken = null;
  });
});

export { db };
