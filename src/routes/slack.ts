import { NextFunction, Request, Response } from "express";
import express from 'express';
import { Server, Socket } from 'socket.io';
import { Model } from "sequelize/types";
import sequelize from '../sequelize';

const router = express.Router();

const { user } = sequelize.models;

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