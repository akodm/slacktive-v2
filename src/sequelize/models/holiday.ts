import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface HolidayAttributes {
  id: number;
  text: string;
  category: string;
  start: string;
  end: string;
  count: number;
  ts: string;
  format: string;
  name: string;
  slack: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface HolidayModel extends Model<HolidayAttributes>, HolidayAttributes {};
export class Holiday extends Model<HolidayModel, HolidayAttributes> {};
export type HolidayStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): HolidayModel;
};

export const holidayTable = (sequelize: Sequelize): HolidayStatic => {
  return <HolidayStatic>sequelize.define('holiday', {
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
    start: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "시작일"
    },
    end: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "종료일"
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "갯 수"
    },
    ts: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "슬랙 메시지 타임스탬프",
      unique: true,
    },
    format: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "변환된 시간"
    },
    name: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: "이름"
    },
    slack: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      comment: "슬랙 아이디"
    },
  }, {
    freezeTableName: true,
  });
};