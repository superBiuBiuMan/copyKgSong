import express from "express";
import { cookieToJson } from "../util/util.js";
import { createRequest } from "../util/request.js";
import decode from "safe-decode-uri-component";

const router = express.Router();

// 引入父级的登录模块
import loginQrKeyModule from "../module/login_qr_key.js";
import loginQrCreateModule from "../module/login_qr_create.js";
import loginQrCheckModule from "../module/login_qr_check.js";
import userPlaylistModule from "../module/user_playlist.js";
import playlistTrackAllModule from "../module/playlist_track_all.js";

// 处理模块请求的通用函数
async function handleModuleRequest(req, res, moduleHandler) {
  try {
    // 解析 cookie
    [req.query, req.body].forEach((item) => {
      if (typeof item.cookie === "string") {
        item.cookie = cookieToJson(decode(item.cookie));
      }
    });

    const query = Object.assign({}, { cookie: req.cookies }, req.query, {
      body: req.body,
    });

    const moduleResponse = await moduleHandler(query, (config) => {
      let ip = req.ip;
      if (ip && ip.substring(0, 7) === "::ffff:") {
        ip = ip.substring(7);
      }
      config.ip = ip;
      return createRequest(config);
    });

    const cookies = moduleResponse.cookie;
    if (Array.isArray(cookies) && cookies.length > 0) {
      res.append(
        "Set-Cookie",
        cookies.map((cookie) => `${cookie}; PATH=/`)
      );
    }

    res.status(moduleResponse.status).send(moduleResponse.body);
  } catch (error) {
    const moduleResponse = error;
    res
      .status(moduleResponse.status || 500)
      .send(moduleResponse.body || { status: 0, error: error.message });
  }
}

// 二维码登录 - 获取二维码key (使用父级模块)
router.get("/login/qr/key", async (req, res) => {
  await handleModuleRequest(req, res, loginQrKeyModule);
});

// 二维码登录 - 生成二维码 (使用父级模块)
router.get("/login/qr/create", async (req, res) => {
  await handleModuleRequest(req, res, loginQrCreateModule);
});

// 二维码登录 - 检查扫码状态 (使用父级模块)
router.get("/login/qr/check", async (req, res) => {
  await handleModuleRequest(req, res, loginQrCheckModule);
});

// 获取用户歌单 - 使用父级相同的API
router.get("/user/playlist", async (req, res) => {
  await handleModuleRequest(req, res, userPlaylistModule);
});

// 获取歌单所有歌曲
router.get("/playlist/track/all", async (req, res) => {
  await handleModuleRequest(req, res, (params, useAxios) => {
    // 这里直接使用父项目 playlist_track_all 的实现：
    // 通过 global_collection_id（即 params.id）获取歌单全部歌曲
    return playlistTrackAllModule(params, useAxios);
  });
});

export default router;
