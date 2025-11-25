<template>
  <div class="playlist-detail">
    <div class="header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>{{ playlistName }}</h1>
      <div class="export-buttons">
        <button @click="createBackupNow" class="btn-backup">📦 创建备份</button>
        <button @click="viewCurrentPlaylistBackups" class="btn-backups">
          📋 查看备份
        </button>
        <button @click="compareWithBackup" class="btn-compare">
          🔄 对比备份
        </button>
        <button @click="exportJSON">导出 JSON</button>
        <button @click="exportCSV">导出 CSV</button>
        <button @click="exportExcel">导出 Excel</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="songs">
      <div class="stats">共 {{ songs.length }} 首歌曲</div>

      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>歌曲名</th>
            <th>歌手</th>
            <th>专辑</th>
            <th>时长</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(song, index) in songs" :key="song.hash">
            <td>{{ index + 1 }}</td>
            <td>{{ song.name }}</td>
            <td>{{ song.author }}</td>
            <td>{{ song.album }}</td>
            <td>{{ formatTime(song.timelen) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { get } from "../utils/request";
import {
  exportToJSON,
  exportToCSV,
  exportToExcel,
  formatSongsForExport,
} from "../utils/export";
import { createBackup, getBackupList } from "../utils/backupApi";

const router = useRouter();
const route = useRoute();

const songs = ref([]);
const loading = ref(true);
const error = ref("");
const playlistName = ref(route.query.name || "歌单详情");

onMounted(async () => {
  await fetchSongs();
});

async function fetchSongs() {
  try {
    loading.value = true;
    const globalCollectionId = route.query.global_collection_id;

    if (!globalCollectionId) {
      error.value = "缺少歌单ID";
      return;
    }

    let allSongs = [];
    let currentPage = 1;
    const pageSize = 250;

    while (true) {
      const response = await get("/playlist/track/all", {
        id: globalCollectionId,
        page: currentPage,
        pagesize: pageSize,
      });

      console.log("API Response:", response);

      if (response.status === 1) {
        // 检查数据在 songs 还是 info 字段
        const trackList = response.data.songs || response.data.info || [];

        if (trackList.length === 0) break;

        const formattedSongs = trackList
          .filter((track) => track.hash)
          .map((track) => {
            const nameParts = track.name.split(" - ");
            return {
              hash: track.hash,
              name: nameParts.length > 1 ? nameParts[1] : track.name,
              author: nameParts.length > 1 ? nameParts[0] : "",
              album: track.albuminfo?.name || "",
              timelen: track.timelen || 0,
            };
          });

        allSongs = allSongs.concat(formattedSongs);
        console.log(
          `第${currentPage}页加载了 ${formattedSongs.length} 首歌曲，总计 ${allSongs.length} 首`
        );

        if (trackList.length < pageSize) break;
        currentPage++;
      } else {
        break;
      }
    }

    songs.value = allSongs;
  } catch (err) {
    error.value = "获取歌曲失败: " + err.message;
  } finally {
    loading.value = false;
  }
}

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

function goBack() {
  router.back();
}

function exportJSON() {
  const data = formatSongsForExport(songs.value);
  exportToJSON(data, playlistName.value);
}

function exportCSV() {
  const data = formatSongsForExport(songs.value);
  exportToCSV(data, playlistName.value);
}

function exportExcel() {
  const data = formatSongsForExport(songs.value);
  exportToExcel(data, playlistName.value, "歌曲列表");
}

async function createBackupNow() {
  if (songs.value.length === 0) {
    alert("歌单为空，无法创建备份");
    return;
  }

  const note = prompt("请输入备份说明（可选）：");
  if (note === null) return; // 用户取消

  try {
    const result = await createBackup(
      route.query.global_collection_id,
      playlistName.value,
      songs.value,
      note
    );

    if (result.success) {
      alert(
        `备份创建成功！\n备份ID: ${result.backupId}\n歌曲数: ${songs.value.length}`
      );
    }
  } catch (err) {
    alert("备份失败: " + err.message);
  }
}

function viewCurrentPlaylistBackups() {
  // 跳转到备份管理页面，并传递当前歌单ID作为筛选条件
  router.push({
    path: "/backup",
    query: {
      playlistId: route.query.global_collection_id,
      playlistName: playlistName.value,
    },
  });
}

async function compareWithBackup() {
  if (songs.value.length === 0) {
    alert("歌单为空，无法对比");
    return;
  }

  try {
    // 获取当前歌单的备份列表
    const result = await getBackupList(route.query.global_collection_id, 10);

    if (!result.success || result.data.length === 0) {
      alert("当前歌单还没有备份，请先创建备份");
      return;
    }

    // 如果只有一个备份，直接跳转对比
    if (result.data.length === 1) {
      router.push({
        path: "/backup/compare",
        query: {
          backupId: result.data[0].id,
          playlistId: route.query.global_collection_id,
          playlistName: playlistName.value,
        },
      });
      return;
    }

    // 多个备份，让用户选择
    const backupList = result.data
      .map((b, index) => `${index + 1}. ${b.backup_time} (${b.song_count}首)`)
      .join("\n");

    const choice = prompt(
      `请选择要对比的备份（输入序号1-${result.data.length}）：\n\n${backupList}`
    );

    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < result.data.length) {
        router.push({
          path: "/backup/compare",
          query: {
            backupId: result.data[index].id,
            playlistId: route.query.global_collection_id,
            playlistName: playlistName.value,
          },
        });
      } else {
        alert("无效的选择");
      }
    }
  } catch (err) {
    alert("获取备份列表失败: " + err.message);
  }
}
</script>

<style scoped>
.playlist-detail {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.back-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.back-btn:hover {
  background: #e0e0e0;
}

h1 {
  flex: 1;
  margin: 0;
}

.export-buttons {
  display: flex;
  gap: 10px;
}

.export-buttons button {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-buttons button:hover {
  background: #66b1ff;
}

.btn-backup {
  background: #67c23a !important;
}

.btn-backup:hover {
  background: #85ce61 !important;
}

.btn-backups {
  background: #e6a23c !important;
}

.btn-backups:hover {
  background: #ebb563 !important;
}

.btn-compare {
  background: #909399 !important;
}

.btn-compare:hover {
  background: #a6a9ad !important;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #f56c6c;
}

.stats {
  margin-bottom: 15px;
  color: #666;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

thead {
  background: #f5f7fa;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 600;
}

tbody tr:hover {
  background: #f5f7fa;
}

th:nth-child(1),
td:nth-child(1) {
  width: 60px;
}
th:nth-child(2),
td:nth-child(2) {
  width: 35%;
}
th:nth-child(3),
td:nth-child(3) {
  width: 25%;
}
th:nth-child(4),
td:nth-child(4) {
  width: 25%;
}
th:nth-child(5),
td:nth-child(5) {
  width: 80px;
}
</style>
