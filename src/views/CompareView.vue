<template>
  <div class="compare-view">
    <div class="header">
      <button @click="goBack" class="back-btn">← 返回</button>
      <h1>歌单差异比对</h1>
      <div class="export-buttons">
        <button @click="exportReport">导出报告</button>
        <button @click="exportCSV">导出 CSV</button>
      </div>
    </div>

    <div v-if="loading" class="loading">正在比对中...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="compare-result">
      <!-- 概览 -->
      <div class="summary">
        <h2>比对概览</h2>
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-value">{{ diff.summary.currentTotal }}</div>
            <div class="card-label">当前歌曲</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ diff.summary.backupTotal }}</div>
            <div class="card-label">备份歌曲</div>
          </div>
          <div class="summary-card added">
            <div class="card-value">{{ diff.summary.addedCount }}</div>
            <div class="card-label">新增歌曲</div>
          </div>
          <div class="summary-card removed">
            <div class="card-value">{{ diff.summary.removedCount }}</div>
            <div class="card-label">删除歌曲</div>
          </div>
          <div class="summary-card same">
            <div class="card-value">{{ diff.summary.sameCount }}</div>
            <div class="card-label">相同歌曲</div>
          </div>
        </div>
      </div>

      <!-- 筛选器 -->
      <div class="filter">
        <button
          :class="['filter-btn', { active: filter === 'all' }]"
          @click="filter = 'all'"
        >
          全部 ({{ totalCount }})
        </button>
        <button
          :class="['filter-btn', { active: filter === 'added' }]"
          @click="filter = 'added'"
        >
          新增 ({{ diff.summary.addedCount }})
        </button>
        <button
          :class="['filter-btn', { active: filter === 'removed' }]"
          @click="filter = 'removed'"
        >
          删除 ({{ diff.summary.removedCount }})
        </button>
        <button
          :class="['filter-btn', { active: filter === 'same' }]"
          @click="filter = 'same'"
        >
          相同 ({{ diff.summary.sameCount }})
        </button>
      </div>

      <!-- 歌曲列表 -->
      <div class="song-list">
        <table>
          <thead>
            <tr>
              <th>状态</th>
              <th>序号</th>
              <th>歌曲名</th>
              <th>歌手</th>
              <th>专辑</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(song, index) in filteredSongs"
              :key="song.hash"
              :class="song.status"
            >
              <td>
                <span :class="['status-badge', song.status]">
                  {{ getStatusText(song.status) }}
                </span>
              </td>
              <td>{{ index + 1 }}</td>
              <td>{{ song.name }}</td>
              <td>{{ song.author }}</td>
              <td>{{ song.album }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { get } from "../utils/request";
import { getBackupDetail } from "../utils/backupApi";
import {
  comparePlaylists,
  generateDiffReport,
  exportDiffToCSV,
} from "../utils/compare";

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const error = ref("");
const diff = ref(null);
const filter = ref("all");

const totalCount = computed(() => {
  if (!diff.value) return 0;
  return (
    diff.value.summary.addedCount +
    diff.value.summary.removedCount +
    diff.value.summary.sameCount
  );
});

const filteredSongs = computed(() => {
  if (!diff.value) return [];

  let songs = [];

  if (filter.value === "all") {
    songs = [
      ...diff.value.added.map((s) => ({ ...s, status: "added" })),
      ...diff.value.removed.map((s) => ({ ...s, status: "removed" })),
      ...diff.value.same.map((s) => ({ ...s, status: "same" })),
    ];
  } else if (filter.value === "added") {
    songs = diff.value.added.map((s) => ({ ...s, status: "added" }));
  } else if (filter.value === "removed") {
    songs = diff.value.removed.map((s) => ({ ...s, status: "removed" }));
  } else if (filter.value === "same") {
    songs = diff.value.same.map((s) => ({ ...s, status: "same" }));
  }

  return songs;
});

onMounted(async () => {
  await loadAndCompare();
});

async function loadAndCompare() {
  try {
    loading.value = true;

    const backupId = route.query.backupId;
    const playlistId = route.query.playlistId;

    if (!backupId || !playlistId) {
      error.value = "缺少必要参数";
      return;
    }

    // 获取备份数据
    const backupRes = await getBackupDetail(backupId);
    if (!backupRes.success) {
      error.value = "获取备份失败";
      return;
    }

    const backupSongs = backupRes.data.songs;

    // 获取当前歌单数据
    const currentRes = await get("/playlist/track/all", {
      id: playlistId,
      page: 1,
      pagesize: 10000,
    });

    if (currentRes.status !== 1) {
      error.value = "获取当前歌单失败";
      return;
    }

    const trackList = currentRes.data.songs || currentRes.data.info || [];
    const currentSongs = trackList
      .filter((track) => track.hash)
      .map((track) => {
        const nameParts = track.name.split(" - ");
        return {
          hash: track.hash,
          name: nameParts.length > 1 ? nameParts[1] : track.name,
          author: nameParts.length > 1 ? nameParts[0] : "",
          album: track.albuminfo?.name || "",
        };
      });

    // 执行比对
    diff.value = comparePlaylists(currentSongs, backupSongs);
  } catch (err) {
    error.value = "比对失败: " + err.message;
  } finally {
    loading.value = false;
  }
}

function getStatusText(status) {
  const map = {
    added: "新增",
    removed: "删除",
    same: "相同",
  };
  return map[status] || status;
}

function goBack() {
  router.back();
}

function exportReport() {
  if (!diff.value) return;

  const report = generateDiffReport(diff.value);
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `歌单差异报告_${new Date().getTime()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCSV() {
  if (!diff.value) return;

  const csv = exportDiffToCSV(diff.value);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `歌单差异_${new Date().getTime()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.compare-view {
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

.summary {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #eee;
}

.summary h2 {
  margin: 0 0 20px 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.summary-card {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  background: #f5f7fa;
}

.summary-card.added {
  background: #f0f9ff;
  border: 1px solid #409eff;
}

.summary-card.removed {
  background: #fef0f0;
  border: 1px solid #f56c6c;
}

.summary-card.same {
  background: #f0f9f0;
  border: 1px solid #67c23a;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.added .card-value {
  color: #409eff;
}

.removed .card-value {
  color: #f56c6c;
}

.same .card-value {
  color: #67c23a;
}

.card-label {
  color: #666;
  font-size: 14px;
}

.filter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.filter-btn.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.song-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
}

table {
  width: 100%;
  border-collapse: collapse;
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

tbody tr.added {
  background: #f0f9ff;
}

tbody tr.removed {
  background: #fef0f0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.added {
  background: #409eff;
  color: white;
}

.status-badge.removed {
  background: #f56c6c;
  color: white;
}

.status-badge.same {
  background: #67c23a;
  color: white;
}

th:nth-child(1),
td:nth-child(1) {
  width: 80px;
}
th:nth-child(2),
td:nth-child(2) {
  width: 60px;
}
th:nth-child(3),
td:nth-child(3) {
  width: 35%;
}
th:nth-child(4),
td:nth-child(4) {
  width: 25%;
}
th:nth-child(5),
td:nth-child(5) {
  width: 25%;
}
</style>
