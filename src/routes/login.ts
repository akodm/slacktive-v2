import express, { NextFunction, Request, Response } from "express";
import { Model } from "sequelize/types";
import axios from "axios";
import qs from 'qs';

import { UserAttributes } from "../sequelize/models/user";
import { encrypt } from "../utils/crypto";
import sequelize from '../sequelize';

const router = express.Router();

const { CLIENT_ID, SECRET_ID, REDIRECTION_URL } = process.env;

const { user, token } = sequelize.models;

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data } = await axios.get("https://slack.com/oauth/authorize", {
      params: {
        scope: ["chat:write:user", "users:read", "channels:history", "channels:read"],
        client_id: CLIENT_ID,
        redirect_uri: REDIRECTION_URL,
      }
    });

    return res.status(200).send(data);
  } catch (err) {
    return next(err);
  }
});

router.get("/process", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;

    const body = qs.stringify({
      client_id: CLIENT_ID,
      client_secret: SECRET_ID,
      edirect_uri: REDIRECTION_URL,
      code
    });

    const { data } = await axios.post("https://slack.com/api/oauth.v2.access", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!data.ok || !data.access_token || !data.user_id) {
      console.log(data);
      return next({ s: 403, m: "로그인에 실패하였습니다." });
    }

    console.log(data);

    const isUser: Model<UserAttributes | null> = await user.findOne({
      where: {
        slack: data.user_id
      }
    });

    if (!isUser || !isUser.getDataValue("slack")) {
      return next({ s: 403, m: "사용자를 찾을 수 없습니다." });
    }

    req.query.slack = data.user_id;

    const access = "access token"; // query  send
    const refresh = "refresh token"; // query send

    await token.update({
      xoxp: encrypt(data.access_token)
    }, {
      where: {
        slack: data.user_id
      }
    });

    return res.status(200).send({
      result: true,
      access,
      refresh
    });
  } catch (err) {
    return next(err);
  }
});

export default router;