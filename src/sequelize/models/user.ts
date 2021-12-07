import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface UserAttributes {
  id: number;
  slack: string;
  name: string;
  channel: string;
  tag: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface UserModel extends Model<UserAttributes>, UserAttributes {};
export class User extends Model<UserModel, UserAttributes> {};
export type UserStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): UserModel;
};

export const userTable = (sequelize: Sequelize): UserStatic => {
  return <UserStatic>sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    slack: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      comment: "슬랙 아이디"
    },
    name: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: "이름"
    },
    channel: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      comment: "슬랙 개인 채널"
    },
    tag: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: "지급 및 구분"
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      comment: "전화번호"
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "이메일"
    },
    address: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "주소"
    },
  }, {
    freezeTableName: true
  });
};