import dotenv from 'dotenv';
dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import logger from 'morgan';
import moment from 'moment';
import cors from 'cors';
import path from 'path';
// import { createAdapter } from 'socket.io-redis';
// import { Server, Socket } from 'socket.io';
// import { createServer } from 'http';
// import { RedisClient } from 'redis';

import loginRouter from './routes/login';
import slackRouter from './routes/slack';
import userRouter from './routes/user';
import sequelize from './sequelize';
moment.locale("ko");

const {
  CLIENT_URL,
  PORT = "3333",
  DB_FORCE = "false",
	pm_id,
	NODE_ENV = "development",
  // REDIS_HOST,
  // REDIS_PORT
} = process.env;

const app = express();

const corsOptions = {
  origin: CLIENT_URL,
  optionsSuccessStatus: 200
};
const port = parseInt(PORT, 10);
const force = DB_FORCE === "true" ? true : false;
let pmInit = false;

app.use(cors(corsOptions));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", "'unsafe-inline'"],
  }
}));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if(NODE_ENV === "production") {
  if(pm_id === "0") {
    pmInit = true;
  } else {
    pmInit = false;
  }
} else {
  pmInit = true;
}

app.listen(port, () => {
  if(force && pmInit) {
    sequelize.sync({ force });
  } else {
    // sequelize.sync();
  }

  console.log("mysql database connect success !");

  console.log(`${process.env?.NODE_ENV} Hello Slacktive ! ${moment().format("YYYY. MM. DD. (ddd) HH:mm:ss")}`);
  process.send && process.send("ready");
});

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  /**
   * Login 여부에 따라 다른 페이지 제공.
   * 인증 여부에 따라 다른 페이지 제공.
   */

  return res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

console.log("React Build File Static Upload.");
app.use(express.static(path.join(__dirname, "client/build")));

/**
 * 로그인 제외 API 들은 모두 사용자 인증을 거쳐야 함.
 */

app.use("/user", userRouter);
app.use("/login", loginRouter);
app.use("/slack", slackRouter(null));

app.use((req: Request, res: Response, next: NextFunction) => {
  return next({ s: 404, m: "존재하지 않는 URL입니다." });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.s || err.status || 500;
  const message = err.m || "문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

  console.log(err);

  return res.status(status).send({
    result: false,
    data: null,
    message
  });
});

export default app;