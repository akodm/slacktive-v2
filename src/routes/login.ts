import { NextFunction, Request, Response } from "express";
import express from 'express';
import { Model } from "sequelize/types";
import sequelize from '../sequelize';
import axios from "axios";
import { encrypt } from "../utils/crypto";
import { UserAttributes } from "../sequelize/models/user";

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
  } catch(err) {
    return next(err);
  }
});

router.get("/process", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;

    const { data } = await axios.get("https://slack.com/api/oauth.access", {
      params : {
        client_id: CLIENT_ID,
        client_secret: SECRET_ID,
        redirect_uri: REDIRECTION_URL,
        code,
      }
    });

    if (!data.ok || !data.access_token || !data.user_id) {
      return next({ s: 403, m: "로그인에 실패하였습니다." });
    }

    const isUser: Model<UserAttributes | null> = await user.findOne({
      where: {
        slack: data.user_id
      }
    });

    if (!isUser || !isUser.getDataValue("id")) {
      return next({ s: 403, m: "사용자를 찾을 수 없습니다." });
    }

    req.query.id = `${isUser.getDataValue("id")}`;
    req.query.slack = data.user_id;

    const access = "access token";
    const refresh = "refresh token";

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