import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface MomentAttributes {
  id: number;
  title: string;
  days: string;
  custom: "Y" | "N";
  createdAt?: Date;
  updatedAt?: Date;
};

export interface MomentModel extends Model<MomentAttributes>, MomentAttributes {};
export class Moment extends Model<MomentModel, MomentAttributes> {};
export type MomentStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): MomentModel;
};

export const momentTable = (sequelize: Sequelize): MomentStatic => {
  return <MomentStatic>sequelize.define('moment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "공휴일 명칭"
    },
    days: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "공휴일 날짜"
    },
    custom: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: "N",
      comment: "회사 사내 공휴일 여부"
    },
  }, {
    freezeTableName: true,
  });
};