import express from "express";
import db from "../db.js";

const router = express.Router();

// 创建备份
router.post("/", (req, res) => {
  try {
    const { playlistId, playlistName, songs, note, userId } = req.body;

    if (!playlistId || !playlistName || !songs) {
      return res.status(400).json({ error: "缺少必要参数" });
    }

    // 确保 userId 是字符串格式，去除可能的 .0 后缀
    const cleanUserId = userId ? String(userId).replace(/\.0$/, "") : "";

    const stmt = db.prepare(`
      INSERT INTO backups (playlist_id, playlist_name, songs, song_count, note, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      playlistId,
      playlistName,
      JSON.stringify(songs),
      songs.length,
      note || "",
      cleanUserId
    );

    res.json({
      success: true,
      backupId: info.lastInsertRowid,
      message: "备份创建成功",
    });
  } catch (error) {
    console.error("创建备份失败:", error);
    res.status(500).json({ error: "创建备份失败: " + error.message });
  }
});

// 获取备份列表
router.get("/list", (req, res) => {
  try {
    const { playlistId, userId, limit = 50 } = req.query;

    // 验证和清理 limit 参数
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 1000);

    // 使用预定义的查询模式，避免动态拼接
    let stmt;
    let backups;

    if (playlistId && userId) {
      // 同时按 playlistId 和 userId 筛选
      console.log("执行查询: playlistId + userId");
      stmt = db.prepare(`
        SELECT id, playlist_id, playlist_name, song_count, backup_time, note, user_id
        FROM backups 
        WHERE playlist_id = ? AND user_id = ? 
        ORDER BY backup_time DESC 
        LIMIT ?
      `);
      backups = stmt.all(playlistId, userId, safeLimit);
    } else if (playlistId) {
      // 只按 playlistId 筛选
      console.log("执行查询: playlistId");
      stmt = db.prepare(`
        SELECT id, playlist_id, playlist_name, song_count, backup_time, note, user_id
        FROM backups 
        WHERE playlist_id = ? 
        ORDER BY backup_time DESC 
        LIMIT ?
      `);
      backups = stmt.all(playlistId, safeLimit);
    } else if (userId) {
      // 只按 userId 筛选
      // 清理 userId，去除可能的 .0 后缀
      const cleanUserId = String(userId).replace(/\.0$/, "");
      console.log("执行查询: userId =", userId, "清理后:", cleanUserId);

      // 先查看数据库中所有的 user_id
      const allUsers = db.prepare("SELECT DISTINCT user_id FROM backups").all();
      console.log("数据库中的所有 user_id:", allUsers);

      // 使用 LIKE 查询，兼容带 .0 和不带 .0 的情况
      stmt = db.prepare(`
        SELECT id, playlist_id, playlist_name, song_count, backup_time, note, user_id
        FROM backups 
        WHERE user_id = ? OR user_id = ?
        ORDER BY backup_time DESC 
        LIMIT ?
      `);
      backups = stmt.all(cleanUserId, cleanUserId + ".0", safeLimit);
      console.log("查询结果数量:", backups.length);
    } else {
      // 无筛选条件，返回所有
      stmt = db.prepare(`
        SELECT id, playlist_id, playlist_name, song_count, backup_time, note, user_id
        FROM backups 
        ORDER BY backup_time DESC 
        LIMIT ?
      `);
      backups = stmt.all(safeLimit);
    }

    res.json({
      success: true,
      data: backups,
      count: backups.length,
    });
  } catch (error) {
    console.error("获取备份列表失败:", error);
    res.status(500).json({ error: "获取备份列表失败: " + error.message });
  }
});

// 获取指定备份详情
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;

    // 验证 id 是否为有效数字
    const backupId = parseInt(id);
    if (isNaN(backupId) || backupId <= 0) {
      return res.status(400).json({ error: "无效的备份ID" });
    }

    const stmt = db.prepare("SELECT * FROM backups WHERE id = ?");
    const backup = stmt.get(backupId);

    if (!backup) {
      return res.status(404).json({ error: "备份不存在" });
    }

    // 解析 songs JSON
    backup.songs = JSON.parse(backup.songs);

    res.json({
      success: true,
      data: backup,
    });
  } catch (error) {
    console.error("获取备份详情失败:", error);
    res.status(500).json({ error: "获取备份详情失败: " + error.message });
  }
});

// 删除备份
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;

    // 验证 id 是否为有效数字
    const backupId = parseInt(id);
    if (isNaN(backupId) || backupId <= 0) {
      return res.status(400).json({ error: "无效的备份ID" });
    }

    const stmt = db.prepare("DELETE FROM backups WHERE id = ?");
    const info = stmt.run(backupId);

    if (info.changes === 0) {
      return res.status(404).json({ error: "备份不存在" });
    }

    res.json({
      success: true,
      message: "备份删除成功",
    });
  } catch (error) {
    console.error("删除备份失败:", error);
    res.status(500).json({ error: "删除备份失败: " + error.message });
  }
});

// 获取统计信息
router.get("/stats/summary", (req, res) => {
  try {
    const { userId } = req.query;

    let stmt;
    let stats;

    if (userId) {
      // 按用户筛选
      stmt = db.prepare(`
        SELECT COUNT(*) as total, SUM(song_count) as totalSongs 
        FROM backups 
        WHERE user_id = ?
      `);
      stats = stmt.get(userId);
    } else {
      // 全局统计
      stmt = db.prepare(`
        SELECT COUNT(*) as total, SUM(song_count) as totalSongs 
        FROM backups
      `);
      stats = stmt.get();
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("获取统计信息失败:", error);
    res.status(500).json({ error: "获取统计信息失败: " + error.message });
  }
});

export default router;
