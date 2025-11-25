import { API_BASE_URL } from "./request";

// 备份服务 API 封装
const BACKUP_API_BASE = `${API_BASE_URL}/api/backup`;

/**
 * 创建备份
 */
export async function createBackup(playlistId, playlistName, songs, note = "") {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

  const response = await fetch(BACKUP_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playlistId,
      playlistName,
      songs,
      note,
      userId: userInfo.userid ? String(userInfo.userid) : "",
    }),
  });

  if (!response.ok) {
    throw new Error("创建备份失败");
  }

  return await response.json();
}

/**
 * 获取备份列表
 */
export async function getBackupList(playlistId = null, limit = 50) {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  if (playlistId) {
    params.append("playlistId", playlistId);
  }

  if (userInfo.userid) {
    params.append("userId", String(userInfo.userid));
  }

  const response = await fetch(`${BACKUP_API_BASE}/list?${params}`);

  if (!response.ok) {
    throw new Error("获取备份列表失败");
  }

  return await response.json();
}

/**
 * 获取备份详情
 */
export async function getBackupDetail(backupId) {
  const response = await fetch(`${BACKUP_API_BASE}/${backupId}`);

  if (!response.ok) {
    throw new Error("获取备份详情失败");
  }

  return await response.json();
}

/**
 * 删除备份
 */
export async function deleteBackup(backupId) {
  const response = await fetch(`${BACKUP_API_BASE}/${backupId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("删除备份失败");
  }

  return await response.json();
}

/**
 * 获取统计信息
 */
export async function getBackupStats() {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const params = new URLSearchParams();

  if (userInfo.userid) {
    params.append("userId", String(userInfo.userid));
  }

  const response = await fetch(`${BACKUP_API_BASE}/stats/summary?${params}`);

  if (!response.ok) {
    throw new Error("获取统计信息失败");
  }

  return await response.json();
}
