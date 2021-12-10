import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface TaskAttributes {
  id: number;
  title: string;
  text: string;
  location: string;
  category: string;
  participation: object;
  start: string;
  end: string;
  name: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface TaskModel extends Model<TaskAttributes>, TaskAttributes {};
export class Task extends Model<TaskModel, TaskAttributes> {};
export type TaskStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): TaskModel;
};

export const taskTable = (sequelize: Sequelize): TaskStatic => {
  return <TaskStatic>sequelize.define('task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "제목"
    },
    text: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "내용"
    },
    location: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "장소"
    },
    category: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: "구분"
    },
    participation: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: "참여자들"
    },
    start: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "시작일"
    },
    end: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "종료일"
    },
    name: {
      type: DataTypes.STRING(10),
      allowNull: false,
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