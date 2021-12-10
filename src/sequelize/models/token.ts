import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface TokenAttributes {
  id: number;
  xoxp: string;
  access: string;
  refresh: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface TokenModel extends Model<TokenAttributes>, TokenAttributes {};
export class Token extends Model<TokenModel, TokenAttributes> {};
export type TokenStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): TokenModel;
};

export const tokenTable = (sequelize: Sequelize): TokenStatic => {
  return <TokenStatic>sequelize.define('token', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    xoxp: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "사용자 토큰"
    },
    access: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "사용자 접근 토큰"
    },
    refresh: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "사용자 새고로침 토큰"
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