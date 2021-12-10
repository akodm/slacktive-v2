import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface AttenAttributes {
  id: number;
  text: string;
  category: string;
  time: string;
  ts: string;
  format: string;
  name: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface AttenModel extends Model<AttenAttributes>, AttenAttributes {};
export class Atten extends Model<AttenModel, AttenAttributes> {};
export type AttenStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): AttenModel;
};

export const attenTable = (sequelize: Sequelize): AttenStatic => {
  return <AttenStatic>sequelize.define('atten', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    text: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "내용"
    },
    category: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: "구분"
    },
    time: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "기록 적용 시간"
    },
    ts: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "슬랙 메시지 타임스탬프"
    },
    format: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "변환된 시간"
    },
    name: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: "이름"
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "사용자 아이디"
    },
  }, {
    freezeTableName: true,
  });
};