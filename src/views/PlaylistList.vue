<template>
  <div class="playlist-list">
    <div class="header">
      <h1>我的歌单</h1>
      <div class="header-actions">
        <div class="user-info" v-if="userInfo">
          <img
            :src="getUserAvatar()"
            :alt="userInfo.nickname"
            class="user-avatar"
          />
          <span class="user-name">{{ userInfo.nickname || "用户" }}</span>
        </div>
        <button @click="showBatchBackup" class="batch-backup-btn">
          💾 一键备份
        </button>
        <button @click="goToBackups" class="backup-btn">📋 查看所有备份</button>
        <button @click="logout" class="logout-btn">退出登录</button>
      </div>
    </div>

    <p class="project-info">
      接口参考项目
      <a
        href="https://github.com/MoeKoeMusic/MoeKoeMusic"
        target="_blank"
        rel="noopener noreferrer"
      >
        MoeKoe Music
      </a>
      ，个人主页博客
      <a
        href="https://dreamlove.top/"
        target="_blank"
        rel="noopener noreferrer"
      >
        https://dreamlove.top/
      </a>
    </p>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="error" class="error">
      登录可能失效,请尝试重新登录!{{ error }}
    </div>

    <div v-else class="playlists">
      <div
        v-for="playlist in playlists"
        :key="playlist.listid"
        class="playlist-card"
        @click="goToDetail(playlist)"
      >
        <img :src="getCover(playlist.pic)" :alt="playlist.name" />
        <div class="info">
          <h3>{{ playlist.name }}</h3>
          <p>{{ playlist.count }} 首歌曲</p>
        </div>
      </div>
    </div>

    <!-- 批量备份弹窗 -->
    <div
      v-if="showBatchBackupModal"
      class="modal-overlay"
      @click="closeBatchBackup"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>选择要备份的歌单</h2>
          <button @click="closeBatchBackup" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="select-all">
            <label>
              <input
                type="checkbox"
                v-model="selectAll"
                @change="toggleSelectAll"
              />
              <span>全选</span>
            </label>
          </div>

          <div class="playlist-list-modal">
            <label
              v-for="playlist in playlists"
              :key="playlist.listid"
              class="playlist-item-modal"
            >
              <input
                type="checkbox"
                :value="playlist.listid"
                v-model="selectedPlaylists"
              />
              <span class="playlist-name">{{ playlist.name }}</span>
              <span class="playlist-count">{{ playlist.count }} 首</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeBatchBackup" class="btn-cancel">取消</button>
          <button
            @click="executeBatchBackup"
            class="btn-confirm"
            :disabled="selectedPlaylists.length === 0 || isBackingUp"
          >
            {{
              isBackingUp
                ? `备份中... (${backupProgress}/${selectedPlaylists.length})`
                : `备份 ${selectedPlaylists.length} 个歌单`
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { get } from "../utils/request";
import { createBackup } from "../utils/backupApi";
import defaultCover from "../img/love.png";

const router = useRouter();
const playlists = ref([]);
const loading = ref(true);
const error = ref("");
const userInfo = ref(null);

// 批量备份相关
const showBatchBackupModal = ref(false);
const selectedPlaylists = ref([]);
const selectAll = ref(false);
const isBackingUp = ref(false);
const backupProgress = ref(0);

onMounted(async () => {
  loadUserInfo();
  await fetchPlaylists();
});

function loadUserInfo() {
  const stored = localStorage.getItem("userInfo");
  if (stored) {
    userInfo.value = JSON.parse(stored);
  }
}

async function fetchPlaylists() {
  try {
    loading.value = true;
    const response = await get("/user/playlist", {
      pagesize: 500,
      t: Date.now(),
    });

    if (response.status === 1) {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userid = userInfo.userid;

      // 调试: 打印所有歌单信息
      console.log("=== 调试信息 ===");
      console.log("当前用户ID:", userid);
      console.log("所有歌单:", response.data.info);
      console.log("查找'我喜欢'歌单:");
      response.data.info.forEach((p, index) => {
        console.log(`歌单${index}:`, {
          name: p.name,
          listid: p.listid,
          list_create_userid: p.list_create_userid,
          global_collection_id: p.global_collection_id,
          是否匹配用户ID: p.list_create_userid === userid,
          是否名称为我喜欢: p.name === "我喜欢",
        });
      });

      playlists.value = response.data.info
        .filter(
          (playlist) =>
            playlist.list_create_userid === userid || playlist.name === "我喜欢"
        )
        .sort((a, b) => {
          if (a.name === "我喜欢") return -1;
          if (b.name === "我喜欢") return 1;
          return a.sort - b.sort;
        });
      console.log("过滤后的歌单:", playlists.value);
    } else {
      error.value = "获取歌单失败";
    }
  } catch (err) {
    error.value = "请求失败: " + err.message;
  } finally {
    loading.value = false;
  }
}

function goToDetail(playlist) {
  router.push({
    path: "/detail",
    query: {
      global_collection_id:
        playlist.list_create_gid || playlist.global_collection_id,
      listid: playlist.listid,
      name: playlist.name,
    },
  });
}

function logout() {
  if (confirm("确定要退出登录吗？")) {
    localStorage.removeItem("userInfo");
    router.push("/login");
  }
}

function goToBackups() {
  router.push("/backup");
}

// 处理图片URL
function getCover(pic) {
  if (!pic) return defaultCover;
  return pic.replace("{size}", "480").replace("http://", "https://");
}

// 获取用户头像
function getUserAvatar() {
  if (!userInfo.value) return "";

  // 如果有头像URL
  if (userInfo.value.avatar) {
    return userInfo.value.avatar.replace("http://", "https://");
  }

  // 如果有图片URL
  if (userInfo.value.pic) {
    return userInfo.value.pic
      .replace("{size}", "100")
      .replace("http://", "https://");
  }

  // 默认头像 - 使用用户名首字母生成
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    userInfo.value.nickname || "User"
  )}&background=409eff&color=fff&size=100`;
}

// 显示批量备份弹窗
function showBatchBackup() {
  showBatchBackupModal.value = true;
  selectedPlaylists.value = [];
  selectAll.value = false;
}

// 关闭批量备份弹窗
function closeBatchBackup() {
  if (isBackingUp.value) {
    if (!confirm("备份正在进行中，确定要取消吗？")) {
      return;
    }
  }
  showBatchBackupModal.value = false;
  selectedPlaylists.value = [];
  selectAll.value = false;
  isBackingUp.value = false;
  backupProgress.value = 0;
}

// 全选/取消全选
function toggleSelectAll() {
  if (selectAll.value) {
    selectedPlaylists.value = playlists.value.map((p) => p.listid);
  } else {
    selectedPlaylists.value = [];
  }
}

// 执行批量备份
async function executeBatchBackup() {
  if (selectedPlaylists.value.length === 0) {
    alert("请至少选择一个歌单");
    return;
  }

  isBackingUp.value = true;
  backupProgress.value = 0;

  const results = {
    success: [],
    failed: [],
  };

  for (const listid of selectedPlaylists.value) {
    const playlist = playlists.value.find((p) => p.listid === listid);
    if (!playlist) continue;

    try {
      // 获取歌单详情
      const response = await get("/playlist/track/all", {
        id: playlist.list_create_gid || playlist.global_collection_id,
        page: 1,
        pagesize: 10000,
      });

      if (response.status === 1) {
        const trackList = response.data.songs || response.data.info || [];
        const songs = trackList
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

        // 创建备份
        await createBackup(
          playlist.list_create_gid || playlist.global_collection_id,
          playlist.name,
          songs,
          `批量备份 - ${new Date().toLocaleString("zh-CN")}`
        );

        results.success.push(playlist.name);
      } else {
        results.failed.push(playlist.name);
      }
    } catch (err) {
      console.error(`备份 ${playlist.name} 失败:`, err);
      results.failed.push(playlist.name);
    }

    backupProgress.value++;

    // 延迟1秒，避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 重置备份状态
  isBackingUp.value = false;

  // 显示结果
  let message = `备份完成！\n\n`;
  message += `✅ 成功: ${results.success.length} 个\n`;
  if (results.failed.length > 0) {
    message += `❌ 失败: ${results.failed.length} 个\n\n`;
    message += `失败的歌单:\n${results.failed.join("\n")}`;
  }

  alert(message);

  // 关闭弹窗并重置状态
  showBatchBackupModal.value = false;
  selectedPlaylists.value = [];
  selectAll.value = false;
  backupProgress.value = 0;
}
</script>

<style scoped>
.playlist-list {
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

.project-info {
  margin: 10px 0 20px;
  font-size: 13px;
  color: #666;
}

.project-info a {
  color: #409eff;
  text-decoration: none;
}

.project-info a:hover {
  text-decoration: underline;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 15px;
  background: #f5f7fa;
  border-radius: 20px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #409eff;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-backup-btn {
  padding: 8px 16px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.batch-backup-btn:hover {
  background: #85ce61;
}

.backup-btn {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.backup-btn:hover {
  background: #66b1ff;
}

.logout-btn {
  padding: 8px 16px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #f78989;
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

.playlists {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.playlist-card {
  cursor: pointer;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.playlist-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.playlist-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.info {
  padding: 15px;
}

.info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* 批量备份弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.select-all {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.select-all label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 600;
}

.playlist-list-modal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.playlist-item-modal {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.playlist-item-modal:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.playlist-item-modal input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.playlist-name {
  flex: 1;
  font-size: 14px;
}

.playlist-count {
  color: #999;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-cancel {
  background: #f5f7fa;
  color: #666;
}

.btn-cancel:hover {
  background: #e4e7ed;
}

.btn-confirm {
  background: #67c23a;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #85ce61;
}

.btn-confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
