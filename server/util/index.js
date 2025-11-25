import config from "./config.json" with { type: "json" };
import {
  cryptoAesDecrypt,
  cryptoAesEncrypt,
  cryptoMd5,
  cryptoRSAEncrypt,
  cryptoSha1,
  rsaEncrypt2,
  playlistAesEncrypt,
  playlistAesDecrypt,
  publicLiteRasKey,
  publicRasKey,
} from "./crypto.js";
import { createRequest } from "./request.js";
import {
  signKey,
  signParams,
  signParamsKey,
  signCloudKey,
  signatureAndroidParams,
  signatureRegisterParams,
  signatureWebParams,
} from "./helper.js";
import {
  randomString,
  decodeLyrics,
  parseCookieString,
  cookieToJson,
} from "./util.js";

const {
  apiver,
  appid,
  wx_appid,
  wx_lite_appid,
  wx_secret,
  wx_lite_secret,
  srcappid,
  clientver,
  liteAppid,
  liteClientver,
} = config;

// 判断是否为概念版
const isLite = process.env.platform === "lite";
const useAppid = isLite ? liteAppid : appid;
const useClientver = isLite ? liteClientver : clientver;

export {
  apiver,
  useAppid as appid,
  wx_appid,
  wx_lite_appid,
  wx_secret,
  wx_lite_secret,
  srcappid,
  useClientver as clientver,
  isLite,
  cryptoAesDecrypt,
  cryptoAesEncrypt,
  cryptoMd5,
  cryptoRSAEncrypt,
  cryptoSha1,
  rsaEncrypt2,
  playlistAesEncrypt,
  playlistAesDecrypt,
  createRequest,
  signKey,
  signParams,
  signParamsKey,
  signCloudKey,
  signatureAndroidParams,
  signatureRegisterParams,
  signatureWebParams,
  randomString,
  decodeLyrics,
  parseCookieString,
  cookieToJson,
  publicLiteRasKey,
  publicRasKey,
};
