import { demoUser, seedCategories, seedGoals, seedSettings, seedTransactions } from "../data/seedData.js";
import { readStorage, uid, writeStorage } from "../utils/storage.js";

const DB_KEY = "db";

function defaultDb() {
  return {
    users: [demoUser],
    categories: seedCategories,
    transactions: seedTransactions,
    goals: seedGoals,
    notifications: [
      {
        id: "noti_welcome",
        title: "Chào mừng đến Finance Manager",
        message: "Tài khoản admin đã sẵn sàng để quản lý tài chính cá nhân.",
        type: "system",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ],
    settings: seedSettings,
  };
}

export function getDb() {
  const db = readStorage(DB_KEY, null);
  if (db) return db;
  return writeStorage(DB_KEY, defaultDb());
}

export function saveDb(db) {
  return writeStorage(DB_KEY, db);
}

export function mutateDb(mutator) {
  const db = getDb();
  const result = mutator(db);
  saveDb(db);
  window.dispatchEvent(new CustomEvent("finance-db-change"));
  return result;
}

export function createNotification(title, message, type = "system") {
  return mutateDb((db) => {
    const notification = {
      id: uid("noti"),
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(notification);
    return notification;
  });
}
