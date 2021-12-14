import express, { NextFunction, Request, Response } from "express";
import { Model } from "sequelize/types";
import { Server } from 'socket.io';
import moment from "moment";
import axios from "axios";
import qs from 'qs';

import { channelInit, defaultEvent, holidayChannelEvent, membersInit, timeChannelEvent, timeParser } from "../utils/slack";
import { TimeDataTypes } from "../utils/types";
import { APP_RATE_LIMITED, EVENT_CALLBACK, INIT_DATE, URL_VERIFICATION } from "../utils/consts";
import sequelize from '../sequelize';

const router = express.Router();

const { 
  RELEASE_TIME_CHANNEL, RELEASE_HOLIDAY_CHANNEL,
  TEST_TIME_CHANNEL, TEST_HOLIDAY_CHANNEL,
  NODE_ENV, TOKEN, SLACK_URL
} = process.env;

const HOLIDAY_CHANNEL = NODE_ENV === "development" ? RELEASE_HOLIDAY_CHANNEL : TEST_HOLIDAY_CHANNEL;
const TIME_CHANNEL = NODE_ENV === "development" ? TEST_TIME_CHANNEL : RELEASE_TIME_CHANNEL;

const { user, token, atten } = sequelize.models;

export default (io: Server) => {
  // 팀의 멤버들 확인 및 반영하기.
  router.post("/members", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { init = false, admin_oauth } = req.body;
      let status = 200;

      if (!admin_oauth) {
        return next({ s: 403, m: "권한이 없습니다." });
      }

      const params = qs.stringify({
        token: admin_oauth
      });

      const { data } = await axios.post(`${SLACK_URL}/api/users.list`, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        }
      });

      if (!data.ok || data.error || !data.members?.length) {
        console.log(data);
        return next({ s: 403, m: "팀 멤버를 불러오는데 실패하였습니다." });
      }

      if (init) {
        await Promise
          .all([data.members.map(membersInit)])
          .then(() => {
            console.log("성공적으로 반영되었습니다.");
            status = 201;
          })
          .catch(err => console.error(err.message, "반영 도중 문제가 발생했습니다."));
      }

      return res.status(status).send({
        result: true,
        data: data.members
      });
    } catch (err) {
      return next(err);
    }
  });

  // 팀의 채널 목록 가져오기.
  router.post("/channels", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { init = false, admin_oauth } = req.body;
      let status = 200;

      if (!admin_oauth) {
        return next({ s: 403, m: "권한이 없습니다." });
      }

      const params = qs.stringify({
        token: admin_oauth
      });

      const { data } = await axios.post(`${SLACK_URL}/api/conversations.list`, params, {
        headers: {
          "Content-type": "application/x-www-form-urlencoded",
        }
      });

      if (!data.ok || data.error || !data.channels) {
        console.log(data);
        return next({ s: 403, m: "리스트를 불러오는데 실패하였습니다." });
      }

      const parseData = data.channels.map(info => ({ channel: info.id, memo: info.name }));

      if (init) {
        await Promise
          .all([data.channels.map(channelInit)])
          .then(() => {
            console.log("성공적으로 반영되었습니다.");
            status = 201;
          })
          .catch(err => console.error(err.message, "반영 도중 문제가 발생했습니다."));
      }

      return res.status(status).send({
        result: true,
        data: parseData
      });
    } catch (err) {
      return next(err);
    }
  });

  // 팀의 출퇴근 내역 확인 및 반영하기.
  router.post("/times", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { init = false, admin_oauth } = req.body;
      const now = moment().format(INIT_DATE);
      const oldest = moment(now).format("X");

      if (!admin_oauth) {
        return next({ s: 403, m: "권한이 없습니다." });
      }

      const params = qs.stringify({
        token: admin_oauth,
        channel: TIME_CHANNEL,
        limit: 1000,
        oldest
      });

      const { data } = await axios.post(`${SLACK_URL}/api/conversations.history`, params, {
        headers: { 
          "Content-type": "application/x-www-form-urlencoded" 
        }
      });

      if (!data.ok || data.error || !data.messages.length) {
        console.log(data.error);
        return next({ s: 403, m: "내역을 불러오지 못했습니다." });
      }

      const messages =  data.messages.reverse();

      if (init) {
        const initData: TimeDataTypes[] = messages.map(timeParser);

        await Promise
          .all(initData)
          .then(async (res: TimeDataTypes[]) => {
            const bulkArray = (await res).filter(data => data);

            if (res && res.length) {
              await atten.bulkCreate(bulkArray, { individualHooks: true });
            }
          })
          .catch(err => console.error(err.message, "초기 데이터 생성에 실패하였습니다."));
      }

      return res.status(200).send({
        result: true,
        data: messages
      });
    } catch (err) {
      return next(err);
    }
  });

  // 팀의 휴가 내역 확인 및 반영하기.
  router.post("/holidays", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 출퇴근과 비슷.
      return res.status(200).send({
        result: true,
        data: null
      });
    } catch (err) {
      return next(err);
    }
  });

  router.post("/event", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, challenge, type, event, authorizations } = req.body;

      if (token !== TOKEN) {
        return next({ s: 403, m: "토큰이 없습니다." });
      }

      if (type === URL_VERIFICATION) {
        res.setHeader("Content-type", "application/json");
        return res.send({ challenge });
      }

      if (type === APP_RATE_LIMITED) {
        return next({ s: 403, m: "제한시간이 초과되었습니다." });
      }

      console.log(event);

      if (type !== EVENT_CALLBACK || !event?.channel) {
        return next({ s: 403, m: "알수없는 이벤트입니다." });
      }

      if (authorizations[0].is_bot) {
        console.log("봇이 보낸 메시지입니다.");
      } else {
        switch (event.channel) {
          case TIME_CHANNEL: timeChannelEvent(event);
          break;
          case HOLIDAY_CHANNEL: holidayChannelEvent(event);
          break;
          default: defaultEvent(event);
        }
      }

      return res.status(200).send({});
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
