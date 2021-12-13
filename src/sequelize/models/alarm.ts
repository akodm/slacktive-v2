import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface AlarmAttributes {
  id: number;
  title: string;
  agree: "Y" | "N";
  name: string;
  slack: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface AlarmModel extends Model<AlarmAttributes>, AlarmAttributes {};
export class Alarm extends Model<AlarmModel, AlarmAttributes> {};
export type AlarmStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): AlarmModel;
};

export const alarmTable = (sequelize: Sequelize): AlarmStatic => {
  return <AlarmStatic>sequelize.define('alarm', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "알림명"
    },
    agree: {
      type: DataTypes.STRING(1),
      allowNull: false,
      comment: "수신 여부"
    },
    name: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: "이름"
    },
    slack: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "슬랙 아이디"
    },
  }, {
    freezeTableName: true,
  });
};