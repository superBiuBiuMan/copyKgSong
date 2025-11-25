import * as XLSX from "xlsx";

/**
 * 导出为 JSON 文件
 */
export function exportToJSON(data, filename = "playlist") {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  downloadFile(blob, `${filename}.json`);
}

/**
 * 导出为 CSV 文件
 */
export function exportToCSV(data, filename = "playlist") {
  if (!data || data.length === 0) {
    alert("没有数据可导出");
    return;
  }

  // 获取表头
  const headers = Object.keys(data[0]);

  // 构建 CSV 内容
  let csvContent = headers.join(",") + "\n";

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header] || "";
      // 处理包含逗号或引号的值
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvContent += values.join(",") + "\n";
  });

  // 添加 BOM 以支持中文
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadFile(blob, `${filename}.csv`);
}

/**
 * 导出为 Excel 文件
 */
export function exportToExcel(
  data,
  filename = "playlist",
  sheetName = "Sheet1"
) {
  if (!data || data.length === 0) {
    alert("没有数据可导出");
    return;
  }

  // 创建工作簿
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 导出文件
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * 格式化歌曲数据用于导出
 */
export function formatSongsForExport(songs) {
  return songs.map((song, index) => ({
    序号: index + 1,
    歌曲名: song.name || "",
    歌手: song.author || "",
    专辑: song.album || "",
    时长: formatTime(song.timelen),
    Hash: song.hash || "",
  }));
}

/**
 * 格式化歌单数据用于导出
 */
export function formatPlaylistForExport(playlist) {
  return {
    歌单名称: playlist.name || "",
    创建者: playlist.list_create_username || "",
    歌曲数量: playlist.count || 0,
    创建时间: playlist.publish_date || "",
    标签: playlist.tags || "",
    简介: playlist.intro || "",
  };
}

/**
 * 格式化时间（毫秒转为 mm:ss）
 */
function formatTime(milliseconds) {
  if (!milliseconds) return "00:00";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

/**
 * 下载文件
 */
function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
