import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import qs from 'qs';

import { AUTH_HEADER, KEY_PROPERTY, INVALID_TOKEN, JWT_EXPIRE, BEARER, KEY_PROPERTY_NAME, GRANT_TYPE_REFRESH, API_HEADERS, KEY_PROPERTY_HEADER } from './consts';
import { AccessParamsTypes, AccessTypes, SlackRequest, TokenRequest } from './types';
import sequelize from '../sequelize';
import { decrypt } from './crypto';

const { 
  CLIENT_ID, SECRET_ID, SLACK_URL, 
  JWT_KEY, REF_KEY, ACC_EXPRIESIN, REF_EXPRIESIN, COOKIE_NAME 
} = process.env;

const { user, token } = sequelize.models;

export const random = () => Math.random().toString(36).substr(2, 8);

/**
 * 액세스 및 리프레시 토큰 발급과 재발급 용도.
 */
export const signAccess = (params: AccessParamsTypes): AccessTypes => {
  let result: AccessTypes = {
    access: null,
    refresh: null,
    error: false,
    message: null
  };

  try {
    const payload = {
      ...params,
      salt: random()
    };

    const access = jwt.sign(payload, JWT_KEY, { expiresIn: ACC_EXPRIESIN });
    const refresh = jwt.sign(payload, REF_KEY, { expiresIn: REF_EXPRIESIN });

    result.access = `${BEARER} ${access}`;
    result.refresh = `${BEARER} ${refresh}`;
  } catch (err) {
    console.error(err);
    result.error = true;
    result.message = err.message;
  } finally {
    return result;
  }
};

/**
 * 모든 API 인증에 사용되는 액세스 토큰 검증 미들웨어.
 */
export const verifyAccess = async (req: TokenRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let authToken: string | undefined = req?.headers[AUTH_HEADER];

    if (!authToken?.split(BEARER)[1]?.trim()) {
      return next({ s: 401, m: "인증되지 않은 사용자입니다." });
    }

    authToken = authToken.split(BEARER)[1].trim();

    const result = jwt.verify(authToken, JWT_KEY as string);

    if (!result || !result[KEY_PROPERTY]) {
      return verifyRefresh(req, res, next);
    }

    const getUser: any = await token.findOne({
      include: [
        {
          model: user,
          attributes: ["slack", "name"]
        }
      ],
      where: {
        [KEY_PROPERTY]: decrypt(result[KEY_PROPERTY])
      }
    });

    if(!getUser?.getDataValue(KEY_PROPERTY) || !getUser?.user?.getDataValue("name")) {
      return next({ s: 403, m: "해당 사용자가 없습니다." });
    }

    req.user = {
      [KEY_PROPERTY]: decrypt(result[KEY_PROPERTY]),
      [KEY_PROPERTY_NAME]: getUser.user.getDataValue("name"),
      access: null
    };

    req.headers[KEY_PROPERTY_HEADER] = getUser.getDataValue("refresh");

    return next();
  } catch (err) {
    if (err.message === INVALID_TOKEN) {
      return next({ s: 403, m: "올바르지 않은 토큰입니다." });
    }

    if (err.message === JWT_EXPIRE) {
      return verifyRefresh(req, res, next);
    }

    return next(err);
  }
};

/**
 * 모든 API 인증에 사용되는 리프레시 토큰 검증 미들웨어.
 */
export const verifyRefresh = async (req: TokenRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let authCookie: string | undefined = req?.signedCookies[COOKIE_NAME as string];

    if (!authCookie) {
      res.clearCookie(COOKIE_NAME as string);
      return next({ s: 401, m: "인증되지 않은 사용자입니다." });
    }

    authCookie = decodeURIComponent(authCookie);

    if (!authCookie?.split(BEARER)[1]?.trim()) {
      res.clearCookie(COOKIE_NAME as string);
      return next({ s: 401, m: "인증되지 않은 사용자입니다." });
    }

    authCookie = authCookie.split(BEARER)[1].trim();

    const result = jwt.verify(authCookie, REF_KEY as string);

    if (!result || !result[KEY_PROPERTY]) {
      res.clearCookie(COOKIE_NAME as string);
      return next({ s: 401, m: "로그인이 만료되었습니다. 다시 로그인하여 주세요." });
    }

    const getUser: any = await token.findOne({
      include: [
        {
          model: user,
          attributes: ["slack", "name"]
        }
      ],
      where: {
        [KEY_PROPERTY]: decrypt(result[KEY_PROPERTY]),
        apiRefresh: `${BEARER} ${authCookie}`
      }
    });

    if(!getUser?.getDataValue(KEY_PROPERTY) || !getUser?.user?.getDataValue("name")) {
      res.clearCookie(COOKIE_NAME as string);
      return next({ s: 403, m: "해당 사용자가 없습니다." });
    }

    const { access, error, message }: AccessTypes = signAccess({ [KEY_PROPERTY]: result[KEY_PROPERTY] });

    if (error) {
      res.clearCookie(COOKIE_NAME as string);
      throw { message };
    }

    req.user = {
      [KEY_PROPERTY]: decrypt(result[KEY_PROPERTY]),
      [KEY_PROPERTY_NAME]: getUser.user.getDataValue("name"),
      access
    };

    req.headers[KEY_PROPERTY_HEADER] = getUser.getDataValue("refresh");

    return next();
  } catch (err) {
    res.clearCookie(COOKIE_NAME as string);

    if (err.message === INVALID_TOKEN) {
      return next({ s: 403, m: "올바르지 않은 토큰입니다." });
    }

    if (err.message === JWT_EXPIRE) {
      return next({ s: 401, m: "로그인이 만료되었습니다. 다시 로그인하여 주세요." });
    }

    return next(err);
  }
};

/**
 * Slack 토큰이 필요할 시 미들웨어로 사용.
 */
export const verifySlackRefresh = async (req: SlackRequest, res: Response, next: NextFunction) => {
  try {
    const refresh_token = req.headers[KEY_PROPERTY_HEADER];

    if (!refresh_token) {
      return next({ s: 403, m: "인증되지 않은 사용자 입니다." });
    }

    const body = qs.stringify({
      client_id: CLIENT_ID,
      client_secret: SECRET_ID,
      grant_type: GRANT_TYPE_REFRESH,
      refresh_token
    });

    const { data } = await axios.post(`${SLACK_URL}/api/oauth.v2.access`, body, API_HEADERS);

    let info = {
      access_token: null,
      refresh_token: null,
      id: null
    };

    if (data.token_type === "user") {
      info = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id: data.user_id,
      };
    }

    if (data.token_type === "bot") {
      info = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id: data.bot_user_id,
      };
    }

    if (!info.id) {
      return next({ s: 403, m: "슬랙 토큰 재발급에 실패하였습니다." });
    }

    const getUser = await user.findOne({
      include: [
        {
          model: token,
          attributes: ["slack"],
          required: true,
          where: {
            slack: info.id
          }
        }
      ],
      where: {
        slack: info.id
      }
    });

    if (!getUser?.getDataValue("slack")) {
      return next({ s: 403, m: "존재하지 않는 사용자입니다." });
    }

    await token.update({
      access: info.access_token,
      refresh: info.refresh_token
    }, {
      where: {
        slack: info.id
      }
    });

    req.slack = {
      access_token: info.access_token,
      refresh_token: info.refresh_token
    };

    req.headers[KEY_PROPERTY_HEADER] = null;

    return next();
  } catch (err) {
    return next(err);
  }
};
