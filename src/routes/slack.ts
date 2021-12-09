import { NextFunction, Request, Response } from "express";
import express from 'express';
import { Server, Socket } from 'socket.io';
import { Model } from "sequelize/types";
import sequelize from '../sequelize';

const router = express.Router();

const { user } = sequelize.models;

/**
 * APIs
 * 1. 팀 멤버
 * 2. 팀 채널
 * 3. 채널 히스토리
 * 4. 로그인
 * 5. 이벤트
 * 
 * Fns
 * 1. 출퇴근 파싱
 * 2. 휴가 파싱
 * 3. 야근 기록
 * 4. 각 기록 횟수 및 시간 계산
 */

export default (io: Server) => {
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: Model<any, any>[] = await user.findAll();

      return res.status(200).send({
        result: true,
        data,
      });
    } catch(err) {
      return next(err);
    }
  });

  return router;
};