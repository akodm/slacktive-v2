import dotenv from 'dotenv';
dotenv.config();
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import moment from 'moment';
import sequelize from './sequelize';
import indexRouter from './routes';
import userRouter from './routes/user';
import slackRouter from './routes/slack';
moment.locale("ko");

const {
  CLIENT_URL,
  PORT = "3333",
  DB_FORCE = "false",
	pm_id,
	NODE_ENV = "development",
  REDIS_HOST,
  REDIS_PORT
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
app.use(helmet());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

if(NODE_ENV === "production") {
  if(pm_id === "0") {
    pmInit = true;
  } else {
    pmInit = false;
  }
} else {
  pmInit = true;
}

const httpServer = createServer(app);

const io = new Server(httpServer);

const pubClient = createClient({ socket: { host: REDIS_HOST, port: parseInt(REDIS_PORT, 10) }});
const subClient = pubClient.duplicate();

(async () => {
  await pubClient.connect();
  await subClient.connect();
})();

io.adapter(createAdapter(pubClient, subClient));

app.listen(port, () => {
  if(force && pmInit) {
    sequelize.sync({ force });
  } else {
    sequelize.sync();
  }

  console.log("mysql database connect success !");

  console.log(`${process.env?.NODE_ENV} Hello Typescript-Express ! ${moment().format("YYYY. MM. DD. (ddd) HH:mm:ss")}`);
  process.send && process.send("ready");
});

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/slack", slackRouter(io));

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