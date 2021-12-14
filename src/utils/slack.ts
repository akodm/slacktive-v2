import { Model } from 'sequelize/types';
import { Op } from 'sequelize';
import moment from 'moment';

import { ATTEN_CATEGORY, CATEGORYS, DEFAULT_FORMAT, NUMBER_EMPTY, PMS, TARDY_AM, TARDY_PM, TIME_REGEXP, UTC_OFFSET } from './consts';
import { DataResTypes, InitTypes, SlackDataTypes, TimeDataTypes, TimeParserTypes } from './types';
import { ChannelAttributes } from '../sequelize/models/channel';
import { StateAttributes } from '../sequelize/models/state';
import { UserAttributes } from '../sequelize/models/user';
import sequelize from '../sequelize';

const { user, channel, state } = sequelize.models;

export const findUserName = async (slack): Promise<string> => {
  try {
    const data: Model<UserAttributes> = await user.findOne({
      where: {
        slack
      }
    });

    return data.getDataValue("name") || null;
  } catch (err) {
    console.error(err.message, "사용자 이름을 찾지 못했습니다.");
    return null;
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
          [Op.or]: ["오후반차", "오전반차", "반차"]
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
  let res = "";

  try {
    let [hour, mint] = text;

    hour = hour?.replace(/시/g, "");
    mint = mint?.replace(/분/g, "");

    const [ H, m, A ] = moment.unix(ts).utcOffset(UTC_OFFSET).format("HH/mm/A")?.split("/");

    console.log("ampm? :", A);

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

    res = `${hour}:${mint}`;

    return {
      hour,
      mint,
      time: moment.unix(ts).utcOffset(UTC_OFFSET).format(`YYYY-MM-DD ${res}`),
      error: null
    };
  } catch (err) {
    return {
      hour: null,
      mint: null,
      time: null,
      error: `${err.message}, ${JSON.stringify(text)}`
    };
  }
};

export const timeParser = async (data): Promise<TimeDataTypes | null> => {
  const { text, user, ts }: SlackDataTypes = data;

  try {
    if (TIME_REGEXP.test(text)) {
      const splitText: RegExpExecArray = TIME_REGEXP.exec(text);
      const tsFormat: string = moment.unix(ts).utcOffset(UTC_OFFSET).format("YYYY-MM-DD HH:mm");
      let category: string = CATEGORYS.reduce((result: string, cate) => (cate.sub.includes(splitText[3])) ? cate.key : result, "출근");
      const { time, error }: TimeParserTypes = timeConversion(ts, [splitText[1], splitText[2]], category);
      const { result, error: err, data }: DataResTypes = await isHalfHoliday(user);
      const name: string | null = await findUserName(user);

      if (!time || error || err) {
        throw { message: error || err };
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
      console.log(JSON.stringify(data), "해당 데이터는 정규식에 의해 처리되지 않았습니다.");
      return null;
    }
  } catch (err) {
    console.error(err.message, "시간 설정에 실패하였습니다.");
    return null;
  }
};

export const defaultEvent = async (event) => {
  try {
    console.log("default event");
  } catch (err) {
    console.error(err.message, "기본 이벤트 처리가 정상적으로 수행되지 않았습니다.");
  }
};

export const timeChannelEvent = async (event) => {
  try {
    console.log("time channel event");
  } catch (err) {
    console.error(err.message, "출퇴근 관련 이벤트 처리가 정상적으로 수행되지 않았습니다.");
  }
};

export const holidayChannelEvent = async (event) => {
  try {
    console.log("holiday channel event");
  } catch (err) {
    console.error(err.message, "휴가 관련 이벤트 처리가 정상적으로 수행되지 않았습니다.");
  }
};

export const messageChangeEvent = async () => {
  try {
    console.log("Message Change");
  } catch (err) {
    console.error(err.message, "메시지 변경 이벤트 처리에 실패하였습니다.");
  }
};

export const messageDeleteEvent = async () => {
  try {
    console.log("Message Delete");
  } catch (err) {
    console.error(err.message, "메시지 삭제 이벤트 처리에 실패하였습니다.");
  }
};

export const messageCreateEvent = async () => {
  try {
    console.log("Message Create");
  } catch (err) {
    console.error(err.message, "메시지 생성 이벤트 처리에 실패하였습니다.");
  }
};
