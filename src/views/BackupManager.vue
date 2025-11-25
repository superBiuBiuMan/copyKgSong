<template>
  <div class="backup-manager">
    <div class="header">
      <h1>{{ pageTitle }}</h1>
      <button @click="goBack" class="back-btn">← 返回</button>
    </div>

    <div class="stats" v-if="stats && !$route.query.playlistId">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total || 0 }}</div>
        <div class="stat-label">总备份数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalSongs || 0 }}</div>
        <div class="stat-label">总歌曲数</div>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="backup-list">
      <div v-if="backups.length === 0" class="empty">暂无备份记录</div>

      <div v-else class="backup-items">
        <div v-for="backup in backups" :key="backup.id" class="backup-item">
          <div class="backup-info">
            <h3>{{ backup.playlist_name }}</h3>
            <p class="backup-meta">
              <span>{{ backup.song_count }} 首歌曲</span>
              <span>{{ formatTime(backup.backup_time) }}</span>
            </p>
            <p v-if="backup.note" class="backup-note">{{ backup.note }}</p>
          </div>
          <div class="backup-actions">
            <button @click="viewSongs(backup.id)" class="btn-view">
              查看歌曲
            </button>
            <button @click="downloadBackup(backup)" class="btn-download">
              下载
            </button>
            <button
              v-if="$route.query.playlistId"
              @click="compareBackup(backup)"
              class="btn-compare"
            >
              比对
            </button>
            <button @click="deleteBackupItem(backup.id)" class="btn-delete">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  getBackupList,
  deleteBackup,
  getBackupStats,
} from "../utils/backupApi";
import { API_BASE_URL } from "../utils/request";
import { exportToJSON } from "../utils/export";

const router = useRouter();
const route = useRoute();
const backups = ref([]);
const stats = ref(null);
const loading = ref(true);
const error = ref("");

const pageTitle = computed(() => {
  if (route.query.playlistName) {
    return `${route.query.playlistName} - 备份列表`;
  }
  return "所有备份";
});

onMounted(async () => {
  await loadData();
});

async function loadData() {
  try {
    loading.value = true;

    // 如果有 playlistId 参数，只加载该歌单的备份
    const playlistId = route.query.playlistId || null;

    // 加载统计信息（只在查看所有备份时显示）
    if (!playlistId) {
      const statsRes = await getBackupStats();
      if (statsRes.success) {
        stats.value = statsRes.data;
      }
    }

    // 加载备份列表
    const response = await getBackupList(playlistId);
    if (response.success) {
      backups.value = response.data;
    }
  } catch (err) {
    error.value = "加载失败: " + err.message;
  } finally {
    loading.value = false;
  }
}

function formatTime(timeStr) {
  const date = new Date(timeStr);
  return date.toLocaleString("zh-CN");
}

function goBack() {
  router.back();
}

function viewSongs(backupId) {
  router.push({
    path: "/backup/view",
    query: { id: backupId },
  });
}

async function downloadBackup(backup) {
  try {
    const apiBase = API_BASE_URL;
    // 获取完整的备份数据（包含歌曲列表）
    const response = await fetch(`${apiBase}/api/backup/${backup.id}`);
    const result = await response.json();

    if (result.success) {
      const data = {
        backupInfo: {
          id: result.data.id,
          playlistName: result.data.playlist_name,
          songCount: result.data.song_count,
          backupTime: result.data.backup_time,
          note: result.data.note,
        },
        songs: result.data.songs,
      };

      exportToJSON(
        data,
        `备份_${result.data.playlist_name}_${result.data.backup_time}`
      );
    }
  } catch (err) {
    alert("下载失败: " + err.message);
  }
}

function compareBackup(backup) {
  router.push({
    path: "/backup/compare",
    query: {
      backupId: backup.id,
      playlistId: backup.playlist_id,
      playlistName: backup.playlist_name,
    },
  });
}

async function deleteBackupItem(backupId) {
  if (!confirm("确定要删除这个备份吗？")) return;

  try {
    await deleteBackup(backupId);
    alert("删除成功");
    await loadData();
  } catch (err) {
    alert("删除失败: " + err.message);
  }
}
</script>

<style scoped>
.backup-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  margin: 0;
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

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #eee;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #f56c6c;
}

.backup-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.backup-item {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.backup-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.backup-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.backup-meta {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.backup-meta span {
  margin-right: 20px;
}

.backup-note {
  margin: 0;
  color: #999;
  font-size: 13px;
  font-style: italic;
}

.backup-actions {
  display: flex;
  gap: 10px;
}

.backup-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-download {
  background: #409eff;
  color: white;
}

.btn-download:hover {
  background: #66b1ff;
}

.btn-compare {
  background: #67c23a;
  color: white;
}

.btn-compare:hover {
  background: #85ce61;
}

.btn-delete {
  background: #f56c6c;
  color: white;
}

.btn-delete:hover {
  background: #f78989;
}
</style>
