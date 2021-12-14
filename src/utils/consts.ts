export const TIME_REGEXP = /^([0-9]{1,}시)?시?\s*([0-9]{1,}분)?분?\s*\W*?\s*(출근|ㅊㄱ|퇴근|ㅌㄱ|외근|ㅇㄱ|야근|예비군|민방위|개인\s*사유|입원|병원|복귀|ㅂㄱ)/;
export const HOLIDAY_REGEXP = /\[\s*(\S*)\s*\]\s*(\d*년)?\s*(\d*월)?\s*((\s*\d*년?\s*\d*월?\s*\d*일?[\,*\s+\~*]?)*)*\s*(.*)/;

export const NUMBER_EMPTY = /\d{2}/;

export const DEFAULT_FORMAT = "YYYY-MM-DD HH:mm";
export const INIT_DATE = process.env.INIT_DATE || "YYYY-01-01";
export const UTC_OFFSET = "+09:00";

export const OVER_TIME_VALUE = 10;
export const OVER_TIME_VALUE_HALF = 4;

export const TARDY_AM = "11:00";
export const TARDY_PM = "15:00";

export const AMS = ["AM", "Am", "am", "오전", "새벽", "아침"];
export const PMS = ["PM", "Pm", "pm", "오후", "저녁", "밤", "점심"];

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

export const ATTEN_CATEGORY = ["출근", "외근", "ㅊㄱ", "ㅇㄱ"];

export const URL_VERIFICATION = "url_verification";
export const APP_RATE_LIMITED = "app_rate_limited";
export const EVENT_CALLBACK = "event_callback";

export const MESSAGE_CHANGED = "message_changed";
export const MESSAGE_DELETED = "message_deleted";