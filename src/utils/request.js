// API 请求工具 - 简化版
// 使用统一的服务地址（包含酷狗API代理和备份服务）
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:6522";

// 从 localStorage 获取认证信息
function getAuthParams() {
  const userInfo = localStorage.getItem("userInfo");
  if (!userInfo) return "";

  try {
    const { token, userid } = JSON.parse(userInfo);
    if (token && userid) {
      return `cookie=token=${encodeURIComponent(
        token
      )};userid=${encodeURIComponent(userid)}`;
    }
  } catch (e) {
    console.error("解析用户信息失败:", e);
  }
  return "";
}

// 封装 GET 请求
export async function get(url, params = {}) {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams(params).toString();
    const authParams = getAuthParams();

    let fullUrl = `${API_BASE_URL}${url}`;
    const allParams = [queryParams, authParams].filter((p) => p).join("&");
    if (allParams) {
      fullUrl += `?${allParams}`;
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("请求失败:", error);
    throw error;
  }
}

// 封装 POST 请求
export async function post(url, data = {}) {
  try {
    const authParams = getAuthParams();
    let fullUrl = `${API_BASE_URL}${url}`;
    if (authParams) {
      fullUrl += `?${authParams}`;
    }

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("请求失败:", error);
    throw error;
  }
}
