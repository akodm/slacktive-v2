export const TIME_REGEXP = /^([0-9]{1,}시)?시?\s*([0-9]{1,}분)?분?\s*\W*?\s*(출근|ㅊㄱ|퇴근|ㅌㄱ|외근|ㅇㄱ|야근|예비군|민방위|개인\s*사유|입원|병원|복귀|ㅂㄱ)/;
export const HOLIDAY_REGEXP = /\[\s*(\S*)\s*\]\s*(\d*년)?\s*(\d*월)?\s*((\s*\d*년?\s*\d*월?\s*\d*일?[\,*\s+\~*]?)*)*\s*(.*)/;
export const BACK_DAY_MONTH_REGEXP = /(\d*년)?\s*(\d*월)\s*(\d*)?/;
export const BACK_DAY_MONTH_REGEXP_E = /(\d*년)?\s*(\d*월)\s*(\d*)/;
export const CATEGORY_REGEXP = /반차/;
export const YEAR_REGEXP = /년/g;
export const MONTH_REGEXP = /월/g;
export const DAY_REGEXP = /일/g;

export const NUMBER_EMPTY_4 = /\d{4}/;
export const NUMBER_EMPTY = /\d{2}/;

export const MULTI_REGEXP = /[~,]/;
export const SPACE_REGEXP = / /g;
export const COMMA_REGEXP = /,/;
export const BACK_REFEXP = /~/;

export const INIT_DATE = process.env.INIT_DATE || "YYYY-01-01";
export const DEFAULT_FORMAT = "YYYY-MM-DD HH:mm";
export const UTC_OFFSET = "+09:00";

export const OVER_TIME_VALUE_HALF = 4;
export const OVER_TIME_VALUE = 10;

export const TARDY_AM = "11:00";
export const TARDY_PM = "15:00";

export const USER_SCOPE = [
  "identity.basic",
  "chat:write",
  "users:read",
  "channels:history",
  "channels:read"
];

export const API_HEADERS = {
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  }
};

export const KEY_PROPERTY_HEADER = "slacktive";
export const KEY_PROPERTY_NAME = "name";
export const KEY_PROPERTY = "slack";

export const AUTH_HEADER = "authorization";
export const BEARER = "Bearer";

export const INVALID_TOKEN = "invalid token";
export const JWT_EXPIRE = "jwt expired";

export const PMS = ["PM", "Pm", "pm", "오후", "저녁", "밤", "점심"];
export const AMS = ["AM", "Am", "am", "오전", "새벽", "아침"];

export const CATEGORYS = [
  {
    key: "출근",
    sub: ["ㅊㄱ", "출근", "츌근", "츨근", "츨군"]
  },
  {
    key: "퇴근",
    sub: ["ㅌㄱ", "퇴근", "퇴군", "퇴금", "퇴긍"]
  },
  {
    key: "외근",
    sub: ["ㅇㄱ", "외근", "외군", "외금", "외긍"]
  },
  {
    key: "복귀",
    sub: ["ㅂㄱ", "복귀", "복긔", "복기"]
  },
];

export const HALF_CATEGORY = ["오후반차", "오전반차", "반차", "오전 반차", "오후 반차"];
export const ATTEN_CATEGORY = ["출근", "외근", "ㅊㄱ", "ㅇㄱ"];

export const URL_VERIFICATION = "url_verification";
export const APP_RATE_LIMITED = "app_rate_limited";
export const EVENT_CALLBACK = "event_callback";

export const MESSAGE_CHANGED = "message_changed";
export const MESSAGE_DELETED = "message_deleted";

export const GRANT_TYPE_AUTH = "authorization_code";
export const GRANT_TYPE_REFRESH = "refresh_token";
