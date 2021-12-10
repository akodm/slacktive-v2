export const TIME_REGEXP = /^([0-9]{1,}시)?시?\s*([0-9]{1,}분)?분?\s*\W*?\s*(출근|ㅊㄱ|퇴근|ㅌㄱ|외근|ㅇㄱ|야근|예비군|민방위|개인\s*사유|입원|병원|복귀|ㅂㄱ)/;
export const HOLIDAY_REGEXP = /\[\s*(\S*)\s*\]\s*(\d*년)?\s*(\d*월)?\s*((\s*\d*년?\s*\d*월?\s*\d*일?[\,*\s+\~*]?)*)*\s*(.*)/;
export const INIT_DATE = process.env.INIT_DATE || "YYYY-01-01";

export const OVER_TIME_VALUE = 10;
export const OVER_TIME_VALUE_HALF = 4;

export const TARDY_AM = "11:00";
export const TARDY_PM = "15:00";