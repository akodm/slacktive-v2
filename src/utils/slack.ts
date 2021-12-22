import { Model } from 'sequelize/types';
import { NextFunction } from 'express';
import { Op } from 'sequelize';
import moment from 'moment';
import axios from 'axios';
import qs from 'qs';

import { ATTEN_CATEGORY, BACK_DAY_MONTH_REGEXP, BACK_DAY_MONTH_REGEXP_E, BACK_REFEXP, CATEGORYS, CATEGORY_REGEXP, COMMA_REGEXP, DAY_REGEXP, DEFAULT_FORMAT, HALF_CATEGORY, HOLIDAY_REGEXP, MESSAGE_CHANGED, MESSAGE_CREATED, MESSAGE_DELETED, MONTH_REGEXP, MULTI_REGEXP, NUMBER_EMPTY, NUMBER_EMPTY_4, PMS, SPACE_REGEXP, TARDY_AM, TARDY_PM, TIME_REGEXP, UTC_OFFSET, YEAR_REGEXP } from './consts';
import { DataResTypes, GetUserTypes, HolidayConversionTypes, HolidayReturnTypes, InitTypes, MessageChangeEventTypes, MessageCreateEventTypes, MessageDeleteEventTypes, SlackDataTypes, TimeReturnTypes, TimeParserTypes } from './types';
import { ChannelAttributes } from '../sequelize/models/channel';
import { StateAttributes } from '../sequelize/models/state';
import { UserAttributes } from '../sequelize/models/user';
import { API_HEADERS } from './consts';
import { signAccess } from './token';
import sequelize from '../sequelize';
import { encrypt } from './crypto';

const { user, token, channel, state, atten, holiday } = sequelize.models;

const { NODE_ENV, SLACK_URL, RELEASE_HOLIDAY_CHANNEL, TEST_HOLIDAY_CHANNEL, RELEASE_TIME_CHANNEL, TEST_TIME_CHANNEL } = process.env;

const HOLIDAY_CHANNEL = NODE_ENV === "development" ? TEST_HOLIDAY_CHANNEL : RELEASE_HOLIDAY_CHANNEL;
const TIME_CHANNEL = NODE_ENV === "development" ? TEST_TIME_CHANNEL : RELEASE_TIME_CHANNEL;

export const loginProcess = async (data, isBot: boolean, next: NextFunction) => {
  try {
    let info = null;

    if (!isBot) {
      const body = qs.stringify({
        token: data.access_token
      });
  
      info = await axios.post(`${SLACK_URL}/api/users.identity`, body, API_HEADERS);
    }

    const slack = encrypt(data.id);

    const { access, refresh, error, message } = signAccess({ slack });

    if (error) {
      return next({ s: 403, m: message });
    }

    await sequelize.transaction(async transaction => {
      const userData: [Model<UserAttributes>, boolean] = await user.findOrCreate({
        where: {
          slack: data.id,
        },
        defaults: {
          slack: data.id,
          name: (info?.data?.user?.name) || "BOT"
        },
        transaction
      });

      if (userData[1]) {
        await token.create({
          slack: data.id,
          apiRefresh: refresh,
          access: data.access_token,
          refresh: data.refresh_token
        }, {
          transaction
        });
      } else {
        await token.update({
          apiRefresh: refresh,
          access: data.access_token,
          refresh: data.refresh_token
        }, {
          where: {
            slack: data.id
          },
          transaction
        });
      }
    });

    return { access, refresh };
  } catch (err) {
    return next(err);
  }
};

export const findUser = async (slack): Promise<GetUserTypes> => {
  try {
    const data: Model<UserAttributes> = await user.findOne({
      attributes: ["slack", "name"],
      where: {
        slack
      }
    });

    if (!data?.getDataValue("slack")) {
      throw { message: "slack user not found." };
    }

    return { 
      name: data.getDataValue("name"), 
      slack: data.getDataValue("slack") 
    };
  } catch (err) {
    console.error(err.message, "사용자 이름을 찾지 못했습니다.");
    return {
      name: null,
      slack: null
    };
  }
};

export const membersInit = async (data): Promise<InitTypes> => {
  const { profile, id } = data;
  let res: InitTypes = {
    result: false,
    create: false,
    error: null,
    data: null
  };

  try {
    const result: [Model<UserAttributes>, boolean] = await user.findOrCreate({
      where: {
        slack: data.id
      },
      defaults: {
        slack: id,
        name: profile.real_name,
        phone: profile.phone
      }
    });

    res.create = result[1];
    res.data = result[0];
  } catch (err) {
    res.error = err.message;
  } finally {
    return res;
  }
};

export const channelInit = async (data): Promise<InitTypes>  => {
  const { id, name } = data;
  let res: InitTypes = {
    result: false,
    create: false,
    error: null,
    data: null
  };

  try {
    const result: [Model<ChannelAttributes>, boolean] = await channel.findOrCreate({
      where: {
        channel: id
      },
      defaults: {
        channel: id,
        memo: name
      }
    });

    res.create = result[1];
    res.data = result[0];
  } catch (err) {
    res.error = err.message;
  } finally {
    return res;
  }
};

export const isHalfHoliday = async (slack): Promise<DataResTypes> => {
  let res: DataResTypes = {
    result: false,
    error: null,
    data: null
  };

  try {
    const userState: Model<StateAttributes> | null = await state.findOne({
      where: {
        slack,
        state: {
          [Op.or]: HALF_CATEGORY
        }
      }
    });

    if (userState?.getDataValue("id")) {
      res.result = true;
      res.data = userState;
    }
  } catch (err) {
    res.error = err.message;
  } finally {
    return res;
  }
};

export const timeConversion = (ts: number, text: string[], category): TimeParserTypes => {
  let res = {
    hour: null,
    mint: null,
    time: null,
    error: null,
  };

  try {
    let [hour, mint] = text;

    hour = hour?.replace(/시/g, "");
    mint = mint?.replace(/분/g, "");

    const [H, m, A] = moment.unix(ts).utcOffset(UTC_OFFSET).format("HH/mm/A")?.split("/");

    if (hour && PMS.includes(A) && parseInt(hour) <= 12 && category === "퇴근") {
      hour = `${parseInt(hour, 10) + 12}`;
    }

    if (hour && H === "00" && hour === "12") {
      hour = "00";
    }

    if (!hour && !mint) {
      mint = m;
    }

    if (hour && !mint) {
      mint = "00";
    }

    if (!hour && mint && parseInt(mint) > parseInt(m)) {
      hour = `${parseInt(hour) - 1}`;
    }

    if (!hour) {
      hour = H;
    }

    if (!mint) {
      mint = m;
    }

    if (!NUMBER_EMPTY.test(hour)) {
      hour = `0${hour}`;
    }

    if (!NUMBER_EMPTY.test(mint)) {
      mint = `0${mint}`;
    }

    res.hour = hour;
    res.mint = mint;
    res.time = moment.unix(ts).utcOffset(UTC_OFFSET).format(`YYYY-MM-DD ${hour}:${mint}`);
  } catch (err) {
    res.error = `${err.message}, ${JSON.stringify(text)}`;
  } finally {
    return res;
  }
};

export const timeParser = async (data): Promise<TimeReturnTypes | null> => {
  const { text, user, ts }: SlackDataTypes = data;

  try {
    if (TIME_REGEXP.test(text)) {
      const splitText: RegExpExecArray = TIME_REGEXP.exec(text);
      const tsFormat: string = moment.unix(ts).utcOffset(UTC_OFFSET).format(DEFAULT_FORMAT);
      let category: string = CATEGORYS.reduce((result: string, cate) => (cate.sub.includes(splitText[3])) ? cate.key : result, "출근");
      const { time, error }: TimeParserTypes = timeConversion(ts, [splitText[1], splitText[2]], category);
      const { result, error: err, data }: DataResTypes = await isHalfHoliday(user);
      const { name } = await findUser(user);

      if (!time || error || err) {
        throw { message: error || err };
      }

      if (!name) {
        throw { message: "사용자가 없습니다." };
      }

      let isHalf = false;

      if (result && data) {
        isHalf = true;
      }

      if (ATTEN_CATEGORY.includes(category)) {
        const checkAM = moment.unix(ts).utcOffset(UTC_OFFSET).format(`YYYY-MM-DD ${TARDY_AM}`);
        const checkPM = moment.unix(ts).utcOffset(UTC_OFFSET).format(`YYYY-MM-DD ${TARDY_PM}`);

        if (isHalf) {
          category = moment(time, DEFAULT_FORMAT).isAfter(checkPM, "minutes") ? "지각" : category;
        }

        if (!isHalf) {
          category = moment(time, DEFAULT_FORMAT).isAfter(checkAM, "minutes") ? "지각" : category;
        }
      }

      return {
        text,
        category,
        time,
        ts,
        format: tsFormat,
        name,
        slack: user
      };
    } else {
      console.log(JSON.stringify(data), "해당 출퇴근 데이터는 정규식에 의해 처리되지 않았습니다.");
      return null;
    }
  } catch (err) {
    console.error(err.message, "시간 설정에 실패하였습니다.");
    return null;
  }
};

export const holidayCountCheck = (start: string, end: string, category: string) => {
  let count = 0.0;

  if (CATEGORY_REGEXP.test(category)) {
    count = 0.5;
  } else {
    count = 1.0;
  }

  return (moment(end).diff(start, "days") + count) || 1;
};

export const holidayConversion = (data: HolidayConversionTypes): HolidayReturnTypes[] | null => {
  const result = [];
  
  try {
    const { splitText, category, text, ts, format, name, slack } = data;
    const defaultYear = moment.unix(ts).utcOffset(UTC_OFFSET).format("YYYY")
    const defaultMonth = moment.unix(ts).utcOffset(UTC_OFFSET).format("MM");
    const defaultDay = moment.unix(ts).utcOffset(UTC_OFFSET).format("DD");
    let [, , year = defaultYear, month = defaultMonth, days = defaultDay] = splitText;

    if (!NUMBER_EMPTY_4.test(year)) {
      year = `20${year}`;
    }

    if (!NUMBER_EMPTY.test(month)) {
      month = `0${month}`;
    }

    if (year) {
      year = year.replace(YEAR_REGEXP, "");
    }

    if (month) {
      month = month.replace(MONTH_REGEXP, "");
    }

    if (days) {
      days = days.replace(DAY_REGEXP, "");
      days = days.replace(SPACE_REGEXP, "");
    }

    const date = `${year}-${month}`;

    if (!MULTI_REGEXP.test(days)) {
      days = NUMBER_EMPTY.test(days) ? days : `0${days}`;

      const start = `${date}-${days}`;
      const end = `${date}-${days}`;

      const count = holidayCountCheck(start, end, category);

      result.push({ text, category, ts, start, end, count, format, name, slack });
    }

    if (COMMA_REGEXP.test(days)) {
      const commaData = days.split(",");

      commaData.forEach(day => {
        day = NUMBER_EMPTY.test(day) ? day : `0${day}`;

        const start = `${date}-${day}`;
        const end = `${date}-${day}`;

        const count = holidayCountCheck(start, end, category);

        result.push({ text, category, ts, start, end, count, format, name, slack });
      });
    }

    let endDate = date;
    if (BACK_REFEXP.test(days)) {
      let [day_start, day_end] = days.split("~");

      day_start = NUMBER_EMPTY.test(day_start) ? day_start : `0${day_start}`;

      if (BACK_DAY_MONTH_REGEXP.test(day_end)) {
        day_end = day_end.replace(SPACE_REGEXP, "");

        let [, end_year, end_month, end_day] = BACK_DAY_MONTH_REGEXP_E.exec(day_end);

        end_year = end_year ? end_year.replace(YEAR_REGEXP, "") : year;
        end_month = end_month ? end_month.replace(MONTH_REGEXP, "") : month;
        end_day = end_day ? end_day.replace(DAY_REGEXP, "") : defaultDay;

        end_year = NUMBER_EMPTY_4.test(end_year) ? end_year : `20${end_year}`;
        end_month = NUMBER_EMPTY.test(end_month) ? end_month : `0${end_month}`;
        end_day = NUMBER_EMPTY.test(end_day) ? end_day : `0${end_day}`;

        endDate = `${end_year}-${end_month}`;
        day_end = end_day;
      } else if (!NUMBER_EMPTY.test(day_end)) {
        day_end = `0${day_end}`;
      }

      const start = `${date}-${day_start}`;
      const end = `${endDate}-${day_end}`;

      const count = holidayCountCheck(start, end, category);

      result.push({ text, category, ts, start, end, count, format, name, slack });
    }

    return result;
  } catch (err) {
    console.error(err.message, "휴가 데이터 변환에 실패하였습니다.");
    return null;
  }
};

export const holidayParser = async (data): Promise<HolidayReturnTypes[] | null> => {
  const { text, user, ts }: SlackDataTypes = data;

  try {
    if (HOLIDAY_REGEXP.test(text)) {
      const splitText: RegExpExecArray = HOLIDAY_REGEXP.exec(text);
      const tsFormat: string = moment.unix(ts).utcOffset(UTC_OFFSET).format(DEFAULT_FORMAT);
      const category = splitText[6].replace(SPACE_REGEXP, "") || "휴가";
      const { name } = await findUser(user);

      if (!name) {
        throw { message: "사용자가 없습니다." };
      }
      
      const holidayDatas = holidayConversion({
        splitText, 
        category,
        text,
        ts,
        format: tsFormat,
        name,
        slack: user
      });

      return holidayDatas;
    } else {
      console.log(JSON.stringify(data), "해당 휴가 데이터는 정규식에 의해 처리되지 않았습니다.");
      return null;
    }
  } catch (err) {
    console.error(err.message, "휴가 설정에 실패하였습니다.");
    return null;
  }
};

export const messageChangeEvent = async (channel: string, event: MessageChangeEventTypes) => {
  try {
    if (channel === TIME_CHANNEL) {
      const updatedData = await timeParser(event.message);

      await atten.update({
        ...updatedData
      }, {
        where: {
          ts: event.previous_message.ts
        }
      });
    }

    if (channel === HOLIDAY_CHANNEL) {
      const parseData = await holidayParser(event.message);
      const previousData = await holidayParser(event.previous_message);

      if (parseData && parseData.length && previousData && previousData.length) {
        const updatedData = parseData.filter(arr => arr);
        const deletedData = previousData.filter(arr => arr);

        sequelize.transaction(async transaction => {
          await holiday.destroy({
            where: {
              ts: deletedData.map(del => del.ts.toString())
            },
            transaction
          });

          await holiday.bulkCreate(updatedData, { individualHooks: true, transaction });
        });
      }
    }
  } catch (err) {
    console.error(err.message, "메시지 변경 이벤트 처리에 실패하였습니다.");
  }
};

export const messageDeleteEvent = async (channel: string, event: MessageDeleteEventTypes) => {
  try {
    if (channel === TIME_CHANNEL) {
      await atten.destroy({
        where: {
          ts: event.previous_message.ts
        }
      });
    }

    if (channel === HOLIDAY_CHANNEL) {
      await holiday.destroy({
        where: {
          ts: event.deleted_ts
        }
      });
    }
  } catch (err) {
    console.error(err.message, "메시지 삭제 이벤트 처리에 실패하였습니다.");
  }
};

export const messageCreateEvent = async (channel: string, event: MessageCreateEventTypes) => {
  try {
    if (channel === TIME_CHANNEL) {
      const parseData = await timeParser(event);

      if (parseData) {
        await atten.create({ ...parseData });
      }
    }

    if (channel === HOLIDAY_CHANNEL) {
      const parseData = await holidayParser(event);

      if (parseData && parseData.length) {
        const createdData = parseData.filter(arr => arr);

        await holiday.bulkCreate(createdData, { individualHooks: true });
      }
    }
  } catch (err) {
    console.error(err.message, "메시지 생성 이벤트 처리에 실패하였습니다.");
  }
};

export const defaultEvent = async (event) => {
  try {
    console.log("이곳은 아직 메시지 이벤트가 없습니다.", event);
  } catch (err) {
    console.error(err.message, "기본 이벤트 처리가 정상적으로 수행되지 않았습니다.");
  }
};

export const timeChannelEvent = (event): void => {
  try {
    console.log(event);
    event.subtype = event.subtype ? event.subtype : MESSAGE_CREATED;

    switch(event.subtype) {
      case MESSAGE_DELETED: messageDeleteEvent(TIME_CHANNEL, event);
        return;
      case MESSAGE_CHANGED: messageChangeEvent(TIME_CHANNEL, event);
        return;
      case MESSAGE_CREATED: messageCreateEvent(TIME_CHANNEL, event);
        return;
    }

    console.info(event?.channel, "이벤트 처리가 수행되지 않았습니다.");
  } catch (err) {
    console.error(err.message, "출퇴근 관련 이벤트 처리가 정상적으로 수행되지 않았습니다.");
  }
};

export const holidayChannelEvent = (event): void => {
  try {
    console.log(event);
    event.subtype = event?.subtype ? event.subtype : MESSAGE_CREATED;

    switch(event.subtype) {
      case MESSAGE_DELETED: messageDeleteEvent(HOLIDAY_CHANNEL, event);
        return;
      case MESSAGE_CHANGED: messageChangeEvent(HOLIDAY_CHANNEL, event);
        return;
      case MESSAGE_CREATED: messageCreateEvent(HOLIDAY_CHANNEL, event);
        return;
    }

    console.info(event?.channel, "이벤트 처리가 수행되지 않았습니다.");
  } catch (err) {
    console.error(err.message, "휴가 관련 이벤트 처리가 정상적으로 수행되지 않았습니다.");
  }
};
