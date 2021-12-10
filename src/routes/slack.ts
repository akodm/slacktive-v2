import { NextFunction, Request, Response } from "express";
import express from 'express';
import { Server } from 'socket.io';
import { Model } from "sequelize/types";
import sequelize from '../sequelize';
import axios from "axios";
import { encrypt } from "../utils/crypto";
import { UserAttributes } from "../sequelize/models/user";

const router = express.Router();

const { CLIENT_ID, SECRET_ID, REDIRECTION_URL } = process.env;

const { user, token } = sequelize.models;

/**
 * APIs
 * 1. 팀 멤버
 * 2. 팀 채널
 * 3. 채널 히스토리
 * 4. 이벤트
 * 
 * Fns
 * 1. 출퇴근 파싱
 * 2. 휴가 파싱
 * 3. 야근 기록
 * 4. 각 기록 횟수 및 시간 계산
 */

export default (io: Server) => {
  return router;
};