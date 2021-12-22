import { Request } from "express";

// 사용자 필수 데이터 타입.
export type GetUserTypes = {
  slack: string;
  name: string;
};

// 초기 생성 데이터 타입.
export type InitTypes = {
  result: boolean;
  create: boolean;
  error: string;
  data: object;
};

// 제너럴 데이터 결과 타입.
export type DataResTypes = {
  result: boolean;
  error: string;
  data: object;
};

// 슬랙에서 넘겨주는 데이터 타입.
export type SlackDataTypes = {
  text: string;
  user: string;
  ts: number;
};

// 시간 변환 데이터 타입.
export type TimeParserTypes = {
  hour: string | null;
  mint: string | null;
  time: string | null;
  error: string | null;
};

// 출퇴근 데이터 타입.
export type TimeReturnTypes = {
  text: string;
  category: string;
  time: string;
  ts: number;
  format: string;
  name: string;
  slack: string;
};

export type HolidayConversionTypes = {
  splitText: RegExpExecArray;
  category: string;
  text: string;
  ts: number;
  format: string;
  name: string;
  slack: string;
};

export type HolidayReturnTypes = {
  text: string;
  category: string;
  start: string;
  end: string;
  count: number;
  ts: number;
  format: string;
  name: string;
  slack: string;
};

// 액세스 토큰 발급 함수 결과 타입.
export type AccessTypes = {
  access: string | null;
  refresh: string | null;
  error: boolean;
  message: string | null;
};

// 액세스 토큰 파라미터 타입.
export type AccessParamsTypes = {
  slack: string;
};

// 토큰 리퀘스트 확장 타입.
export interface TokenRequest extends Request {
  user: {
    slack: string;
    name: string;
    access: string;
  };
};

// 슬랙 리퀘스트 확장 타입.
export interface SlackRequest extends TokenRequest {
  slack: {
    access_token: string;
    refresh_token: string;
  };
};

export interface MessageTypes {
  client_msg_id: string;
  type: string;
  text: string;
  user: string;
  ts: string;
  team: string;
  edited?: {
    user: string;
    ts: string;
  };
  blocks?: {
    type: string;
    block_id: string;
    elements: any[];
  }[];
};

export interface MessageCreateEventTypes extends MessageTypes {
  channel: string;
  event_ts: string;
  channel_type: string;
};

export interface MessageChangeEventTypes {
  type: string;
  subtype: "message_changed";
  hidden: boolean;
  message: MessageTypes & {
    source_team: string;
    user_team: string;
  };
  channel: string;
  previous_message: MessageTypes;
  event_ts: string;
  ts: string;
  channel_type: string;
};

export interface MessageDeleteEventTypes {
  type: string;
  subtype: "message_deleted";
  hidden: boolean;
  deleted_ts: string;
  channel: string;
  previous_message: MessageTypes;
  event_ts: string;
  ts: string;
  channel_type: string;
};
