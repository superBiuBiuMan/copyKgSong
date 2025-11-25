<template>
  <div class="login-page">
    <div class="login-container">
      <h1>歌单管理器</h1>
      <p class="subtitle">请使用酷狗账号登录</p>

      <!-- 扫码登录 -->
      <div class="qr-section">
        <p class="tips">{{ qrTips }}</p>
        <div v-if="qrCode" class="qr-code">
          <img :src="qrCode" alt="二维码" />
        </div>
        <div v-else class="loading">生成二维码中...</div>
      </div>

      <div class="privacy-notice">
        <div class="notice-item">
          <span class="icon">🔒</span>
          <span class="text">服务器不存储登录信息</span>
        </div>
        <div class="notice-item">
          <span class="icon">💾</span>
          <span class="text">只有手动备份才会将歌曲备份到服务器</span>
        </div>
        <div class="notice-item">
          <span class="icon">🛡️</span>
          <span class="text">我们不会主动存储您的数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { get } from "../utils/request";

const router = useRouter();

const qrCode = ref("");
const qrKey = ref("");
const qrTips = ref("请使用酷狗APP扫描二维码登录");
let qrCheckInterval = null;

onMounted(() => {
  initQrLogin();
});

onBeforeUnmount(() => {
  clearInterval(qrCheckInterval);
});

// 初始化二维码登录
async function initQrLogin() {
  try {
    // 获取二维码 key
    const keyResponse = await get("/login/qr/key");
    if (keyResponse.status === 1) {
      qrKey.value = keyResponse.data.qrcode;

      // 生成二维码
      const qrResponse = await get("/login/qr/create", {
        key: qrKey.value,
        qrimg: true,
      });

      if (qrResponse.code === 200) {
        qrCode.value = qrResponse.data.base64;
        startQrCheck();
      }
    }
  } catch (error) {
    console.error("生成二维码失败:", error);
    qrTips.value = "二维码生成失败，请刷新重试";
  }
}

// 检查二维码扫描状态
function startQrCheck() {
  clearInterval(qrCheckInterval);

  qrCheckInterval = setInterval(async () => {
    try {
      const response = await get("/login/qr/check", {
        key: qrKey.value,
        timestamp: Date.now(),
      });

      if (response.status === 1) {
        const { status, nickname } = response.data;

        if (status === 2) {
          qrTips.value = `用户 ${nickname} 已扫码，等待确认...`;
        } else if (status === 4) {
          // 登录成功
          clearInterval(qrCheckInterval);
          saveUserInfo(response.data);
          alert("登录成功！");
          router.push("/");
        } else if (status === 0) {
          // 二维码过期
          clearInterval(qrCheckInterval);
          qrTips.value = "二维码已过期，请重新生成";
          qrCode.value = "";
        }
      }
    } catch (error) {
      console.error("检查二维码状态失败:", error);
    }
  }, 1000);
}

// 保存用户信息到 localStorage
function saveUserInfo(userInfo) {
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  text-align: center;
  margin-bottom: 10px;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 14px;
}

.qr-section {
  text-align: center;
}

.tips {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

.qr-code {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.qr-code img {
  width: 200px;
  height: 200px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
}

.loading {
  padding: 80px 0;
  color: #999;
}

.privacy-notice {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #555;
}

.notice-item:last-child {
  margin-bottom: 0;
}

.notice-item .icon {
  font-size: 18px;
  flex-shrink: 0;
}

.notice-item .text {
  line-height: 1.5;
}
</style>
