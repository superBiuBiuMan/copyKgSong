<template>
  <div class="backup-song-list">
    <div class="header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>{{ backupInfo.playlistName }}</h1>
      <div class="export-buttons">
        <button @click="exportJSON">导出 JSON</button>
        <button @click="exportCSV">导出 CSV</button>
        <button @click="exportExcel">导出 Excel</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="songs">
      <div class="backup-meta">
        <p>
          <strong>备份时间:</strong> {{ formatTime(backupInfo.backupTime) }}
        </p>
        <p><strong>歌曲数量:</strong> {{ backupInfo.songCount }} 首</p>
        <p v-if="backupInfo.note">
          <strong>备注:</strong> {{ backupInfo.note }}
        </p>
      </div>

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
            <td>{{ formatDuration(song.timelen) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getBackupDetail } from "../utils/backupApi";
import {
  exportToJSON,
  exportToCSV,
  exportToExcel,
  formatSongsForExport,
} from "../utils/export";

const router = useRouter();
const route = useRoute();

const songs = ref([]);
const backupInfo = ref({
  playlistName: "",
  songCount: 0,
  backupTime: "",
  note: "",
});
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  await loadBackup();
});

async function loadBackup() {
  try {
    loading.value = true;
    const backupId = route.query.id;

    if (!backupId) {
      error.value = "缺少备份ID";
      return;
    }

    const response = await getBackupDetail(backupId);

    if (response.success) {
      backupInfo.value = {
        playlistName: response.data.playlist_name,
        songCount: response.data.song_count,
        backupTime: response.data.backup_time,
        note: response.data.note,
      };
      songs.value = response.data.songs;
    } else {
      error.value = "获取备份失败";
    }
  } catch (err) {
    error.value = "加载失败: " + err.message;
  } finally {
    loading.value = false;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  return date.toLocaleString("zh-CN");
}

function formatDuration(milliseconds) {
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
  exportToJSON(data, `${backupInfo.value.playlistName}_备份歌曲`);
}

function exportCSV() {
  const data = formatSongsForExport(songs.value);
  exportToCSV(data, `${backupInfo.value.playlistName}_备份歌曲`);
}

function exportExcel() {
  const data = formatSongsForExport(songs.value);
  exportToExcel(data, `${backupInfo.value.playlistName}_备份歌曲`, "歌曲列表");
}
</script>

<style scoped>
.backup-song-list {
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

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #f56c6c;
}

.backup-meta {
  background: #f5f7fa;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.backup-meta p {
  margin: 5px 0;
  color: #666;
}

.backup-meta strong {
  color: #333;
  margin-right: 10px;
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
