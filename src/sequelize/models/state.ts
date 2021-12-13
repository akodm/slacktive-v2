import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface StateAttributes {
  id: number;
  totalOvertime: number;
  attenCount: number;
  holidayCount: number;
  tardyCount: number;
  overtimeCount: number;
  state: string;
  name: string;
  slack: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface StateModel extends Model<StateAttributes>, StateAttributes {};
export class State extends Model<StateModel, StateAttributes> {};
export type StateStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): StateModel;
};

export const stateTable = (sequelize: Sequelize): StateStatic => {
  return <StateStatic>sequelize.define('state', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    totalOvertime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "한 해 총 야근 시간"
    },
    attenCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "한 해 출근 횟수"
    },
    holidayCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "한 해 휴가 사용 횟수"
    },
    tardyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "한 해 지각 횟수"
    },
    overtimeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "한 해 야근 횟수"
    },
    state: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "대기",
      comment: "현재 사용자 상태"
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