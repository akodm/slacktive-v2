import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface OvertimeAttributes {
  id: number;
  startData: number;
  endData: number;
  overtime: number;
  name?: string;
  slack: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface OvertimeModel extends Model<OvertimeAttributes>, OvertimeAttributes {};
export class Overtime extends Model<OvertimeModel, OvertimeAttributes> {};
export type OvertimeStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): OvertimeModel;
};

export const overtimeTable = (sequelize: Sequelize): OvertimeStatic => {
  return <OvertimeStatic>sequelize.define('overtime', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    startDataId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "야근 시작 데이터"
    },
    endDataId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "야근 종료 데이터"
    },
    overtime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "야근 총 시간"
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