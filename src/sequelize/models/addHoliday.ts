import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface AddHolidayAttributes {
  id: number;
  text: string;
  count: number;
  permanent: "Y" | "N";
  name?: string;
  slack: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface AddHolidayModel extends Model<AddHolidayAttributes>, AddHolidayAttributes {};
export class AddHoliday extends Model<AddHolidayModel, AddHolidayAttributes> {};
export type AddHolidayStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): AddHolidayModel;
};

export const addHolidayTable = (sequelize: Sequelize): AddHolidayStatic => {
  return <AddHolidayStatic>sequelize.define('addHoliday', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    text: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "추가 내용"
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "추가 갯 수"
    },
    permanent: {
      type: DataTypes.STRING(1),
      allowNull: false,
      comment: "영구적인 증가 여부"
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