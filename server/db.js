import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建数据库连接
const db = new Database(path.join(__dirname, "backups.db"), {
  verbose: console.log,
});

// 初始化数据库表
function initDatabase() {
  // 备份表
  db.exec(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id TEXT NOT NULL,
      playlist_name TEXT NOT NULL,
      songs TEXT NOT NULL,
      song_count INTEGER NOT NULL,
      backup_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      note TEXT,
      user_id TEXT
    )
  `);

  // 创建索引加速查询
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_playlist_id ON backups(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_backup_time ON backups(backup_time);
    CREATE INDEX IF NOT EXISTS idx_user_id ON backups(user_id);
  `);

  console.log("✅ 数据库初始化完成");
}

// 初始化
initDatabase();

export default db;
