import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface TemporaryAttributes {
  id: number;
  text: string;
  use: "Y" | "N";
  createdAt?: Date;
  updatedAt?: Date;
};

export interface TemporaryModel extends Model<TemporaryAttributes>, TemporaryAttributes {};
export class Temporary extends Model<TemporaryModel, TemporaryAttributes> {};
export type TemporaryStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): TemporaryModel;
};

export const temporaryTable = (sequelize: Sequelize): TemporaryStatic => {
  return <TemporaryStatic>sequelize.define('temporary', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    text: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: "임시 텍스트"
    },
    use: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: "N",
      comment: "사용 여부"
    },
  }, {
    freezeTableName: true,
  });
};