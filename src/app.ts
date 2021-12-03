import dotenv from 'dotenv';
dotenv.config();
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import logger from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import indexRouter from './routes';
import userRouter from './routes/user';
import moment from 'moment';
import sequelize from './sequelize';
import socketIoServer from 'socket.io';
moment.locale("ko");

const { 
  CLIENT_URL,
  PORT = "3333",
  DB_FORCE = "false", 
	pm_id, 
	NODE_ENV = "development",
} = process.env;

const normalizePort = (val: string) => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

const port = normalizePort(PORT);

const app = express();

const corsOptions = {
  origin: CLIENT_URL,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

let pmInit = false;

if(NODE_ENV === "production") {
  if(pm_id === "0") {
    pmInit = true;
  } else {
    pmInit = false;
  }
} else {
  pmInit = true;
}

const force = DB_FORCE === "true" ? true : false;

const socket = new socketIoServer.Server(app.listen(port, () => {
  if(force && pmInit) {
    sequelize.sync({ force });
  } else {
    sequelize.sync();
  }

  console.log("mysql database connect success !");

  console.log(`${process.env?.NODE_ENV} Hello Typescript-Express ! ${moment().format("YYYY. MM. DD. (ddd) HH:mm:ss")}`);
  process.send && process.send("ready");
}), {
  path: '/socket',
  transports: ["websocket"],
  cors: {
    origin: CLIENT_URL,
  }
});

app.on("error", (error: any) => {
  if(error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string"
    ? "Pipe " + port
    : "Port " + port;

  switch(error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
});

app.use("/", indexRouter);
app.use("/user", userRouter);

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