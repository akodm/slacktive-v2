// 초기 생성 데이터 타입
export type InitTypes = {
  result: boolean;
  create: boolean;
  error: string;
  data: object;
};

// 제너럴 데이터 결과 타입
export type DataResTypes = {
  result: boolean;
  error: string;
  data: object;
};

// 슬랙에서 넘겨주는 데이터 타입
export type SlackDataTypes = {
  text: string;
  user: string;
  ts: number;
};

// 시간 변환 데이터 타입
export type TimeParserTypes = {
  hour: string | null;
  mint: string | null;
  time: string | null;
  error: string | null;
};

// 출퇴근 데이터 타입
export type TimeDataTypes = {
  text: string;
  category: string;
  time: string;
  ts: number;
  format: string;
  name: string;
  slack: string;
};
