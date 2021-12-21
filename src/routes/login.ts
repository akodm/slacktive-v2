import express, { NextFunction, Request, Response } from "express";
import { Model } from "sequelize/types";
import moment from "moment";
import axios from "axios";
import qs from 'qs';

import { API_HEADERS, GRANT_TYPE_AUTH, USER_SCOPE } from "../utils/consts";
import { TemporaryAttributes } from "../sequelize/models/temporary";
import { TokenAttributes } from "../sequelize/models/token";
import { random, verifyAccess } from "../utils/token";
import { loginProcess } from "../utils/slack";
import { TokenRequest } from "../utils/types";
import sequelize from '../sequelize';

const router = express.Router();

const { NODE_ENV, CLIENT_ID, SECRET_ID, SLACK_URL, REDIRECTION_URL, COOKIE_NAME, COOKIE_EXPIRES_IN } = process.env;

const SECURE = NODE_ENV !== "development";

const { token, temporary } = sequelize.models;

// 리다이렉트될 슬랙 로그인 API.
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = random() + moment().format("YYMMDDHHmmss");

    await temporary.create({ text: state, use: "N" });

    const { data } = await axios.get(`${SLACK_URL}/oauth/v2/authorize`, {
      params: {
        user_scope: USER_SCOPE,
        client_id: CLIENT_ID,
        redirect_uri: `${REDIRECTION_URL}`,
        state
      }
    });

    return res.send(data);
  } catch (err) {
    return next(err);
  }
});

// 로그인 처리 과정.
router.get("/process", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = req.query;

    const findState: Model<TemporaryAttributes> | null = await temporary.findOne({
      where: {
        text: state,
        use: "N"
      }
    });

    if (!findState || !findState.getDataValue("id")) {
      return next({ s: 403, m: "잘못된 접근입니다." });
    }

    const body = qs.stringify({
      client_id: CLIENT_ID,
      client_secret: SECRET_ID,
      redirect_uri: `${REDIRECTION_URL}`,
      grant_type: GRANT_TYPE_AUTH,
      code
    });

    const { data } = await axios.post(`${SLACK_URL}/api/oauth.v2.access`, body, API_HEADERS);

    if (!data.ok || !data.authed_user?.id) {
      console.log(data);
      return next({ s: 403, m: "로그인에 실패하였습니다." });
    }

    let tokens = null;

    if (data.authed_user?.token_type === "user") {
      const userData = {
        access_token: data.authed_user.access_token,
        refresh_token: data.authed_user.refresh_token,
        id: data.authed_user.id
      };

      tokens = { ...await loginProcess(userData, false, next)  };
    }

    if (data.token_type === "bot") {
      const botData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id: data.bot_user_id,
      };

      tokens = { ...await loginProcess(botData, true, next) };
    }

    await temporary.update({
      use: "Y"
    }, {
      where: {
        text: state,
        use: "N"
      }
    });

    if (!tokens?.access) {
      return next({ s: 403, m: "로그인 처리에 실패하였습니다." });
    }

    return res.cookie(COOKIE_NAME as string, tokens.refresh, {
      signed: true,
      secure: SECURE,
      httpOnly: true,
      sameSite: "lax",
      maxAge: parseInt(COOKIE_EXPIRES_IN, 10) *  24 * 30
    }).send({
      result: true,
      login: "success",
      access: tokens.access
    });
  } catch (err) {
    return next(err);
  }
});

// 로그아웃 처리.
router.delete("/logout", verifyAccess, async (req: TokenRequest, res: Response, next: NextFunction) => {
  try {
    const { slack } = req.user;

    const tokens: Model<TokenAttributes> | null = await token.findOne({
      where: {
        slack
      }
    });

    if (!tokens?.getDataValue("access")) {
      return next({ s: 403, m: "사용자 인증에 실패하였습니다." });
    }

    const { data } = await axios.get(`${SLACK_URL}/api/auth.revoke`, {
      ...API_HEADERS,
      params: {
        token: tokens.getDataValue("access")
      }
    });

    if (!data.ok) {
      console.log(data.error);
      return next({ s: 403, m: "로그아웃 처리가 정상적으로 수행되지 않았습니다. 다시 시도해 주세요." });
    }

    await token.update({
      apiRefresh: null,
      access: null,
    }, {
      where: {
        slack
      }
    });
    
    res.clearCookie(COOKIE_NAME);

    return res.status(200).send({
      result: data.ok
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
