/**
 * 高效的歌单比对算法
 * 使用 Hash Map 实现 O(n) 时间复杂度
 */

/**
 * 比对两个歌单，找出差异
 * @param {Array} currentSongs - 当前歌单
 * @param {Array} backupSongs - 备份歌单
 * @returns {Object} 差异结果
 */
export function comparePlaylists(currentSongs, backupSongs) {
  // 使用 Map 存储歌曲，key 为 hash，value 为歌曲对象
  const currentMap = new Map();
  const backupMap = new Map();

  // 构建当前歌单的 Map (O(n))
  currentSongs.forEach((song) => {
    currentMap.set(song.hash, song);
  });

  // 构建备份歌单的 Map (O(n))
  backupSongs.forEach((song) => {
    backupMap.set(song.hash, song);
  });

  // 找出新增的歌曲（当前有，备份没有）
  const added = [];
  currentMap.forEach((song, hash) => {
    if (!backupMap.has(hash)) {
      added.push(song);
    }
  });

  // 找出删除的歌曲（备份有，当前没有）
  const removed = [];
  backupMap.forEach((song, hash) => {
    if (!currentMap.has(hash)) {
      removed.push(song);
    }
  });

  // 找出相同的歌曲
  const same = [];
  currentMap.forEach((song, hash) => {
    if (backupMap.has(hash)) {
      same.push(song);
    }
  });

  return {
    added, // 新增的歌曲
    removed, // 删除的歌曲
    same, // 相同的歌曲
    summary: {
      addedCount: added.length,
      removedCount: removed.length,
      sameCount: same.length,
      currentTotal: currentSongs.length,
      backupTotal: backupSongs.length,
    },
  };
}

/**
 * 批量比对多个备份
 * @param {Array} currentSongs - 当前歌单
 * @param {Array} backups - 多个备份
 * @returns {Array} 每个备份的比对结果
 */
export function compareMultipleBackups(currentSongs, backups) {
  return backups.map((backup) => ({
    backupId: backup.id,
    backupName: backup.playlist_name,
    backupTime: backup.backup_time,
    diff: comparePlaylists(currentSongs, backup.songs),
  }));
}

/**
 * 生成差异报告文本
 * @param {Object} diff - 比对结果
 * @returns {String} 报告文本
 */
export function generateDiffReport(diff) {
  const { summary, added, removed } = diff;

  let report = "# 歌单差异报告\n\n";
  report += `## 概览\n`;
  report += `- 当前歌曲总数: ${summary.currentTotal}\n`;
  report += `- 备份歌曲总数: ${summary.backupTotal}\n`;
  report += `- 新增歌曲: ${summary.addedCount}\n`;
  report += `- 删除歌曲: ${summary.removedCount}\n`;
  report += `- 相同歌曲: ${summary.sameCount}\n\n`;

  if (added.length > 0) {
    report += `## 新增歌曲 (${added.length}首)\n`;
    added.forEach((song, index) => {
      report += `${index + 1}. ${song.name} - ${song.author}\n`;
    });
    report += "\n";
  }

  if (removed.length > 0) {
    report += `## 删除歌曲 (${removed.length}首)\n`;
    removed.forEach((song, index) => {
      report += `${index + 1}. ${song.name} - ${song.author}\n`;
    });
    report += "\n";
  }

  return report;
}

/**
 * 导出差异为 CSV
 * @param {Object} diff - 比对结果
 * @returns {String} CSV 内容
 */
export function exportDiffToCSV(diff) {
  const { added, removed } = diff;

  let csv = "类型,歌曲名,歌手,专辑,Hash\n";

  added.forEach((song) => {
    csv += `新增,${song.name},${song.author},${song.album || ""},${
      song.hash
    }\n`;
  });

  removed.forEach((song) => {
    csv += `删除,${song.name},${song.author},${song.album || ""},${
      song.hash
    }\n`;
  });

  return csv;
}
