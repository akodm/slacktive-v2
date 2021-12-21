import { Sequelize, DataTypes, BuildOptions, Model } from 'sequelize';

export interface ChannelAttributes {
  id: number;
  channel: string;
  memo?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface ChannelModel extends Model<ChannelAttributes>, ChannelAttributes {};
export class Channel extends Model<ChannelModel, ChannelAttributes> {};
export type ChannelStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): ChannelModel;
};

export const channelTable = (sequelize: Sequelize): ChannelStatic => {
  return <ChannelStatic>sequelize.define('channel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    channel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: "채널 아이디"
    },
    memo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "채널에 관한 메모"
    },
  }, {
    freezeTableName: true,
  });
};