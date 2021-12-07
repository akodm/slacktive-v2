import { Sequelize } from 'sequelize';
import { AddHolidayStatic, addHolidayTable } from './models/addHoliday';
import { AlarmStatic, alarmTable } from './models/alarm';
import { AttenStatic, attenTable } from './models/atten';
import { ChannelStatic, channelTable } from './models/channel';
import { HolidayStatic, holidayTable } from './models/holiday';
import { MomentStatic, momentTable } from './models/moment';
import { OvertimeStatic, overtimeTable } from './models/overtime';
import { StateStatic, stateTable } from './models/state';
import { TaskStatic, taskTable } from './models/task';
import { TokenStatic, tokenTable } from './models/token';
import { UserStatic, userTable } from './models/user';

console.log("mysql database connecting..");

const { 
	DB = "database", 
	ROOT = "root", 
	PASS = "pass", 
	HOST = "localhost", 
	DB_PORT = "3306",
} = process.env;

let sequelize: Sequelize;

try {
	sequelize = new Sequelize(
    DB, 
    ROOT, 
    PASS, 
    {
      host : HOST,
			port: parseInt(DB_PORT, 10),
      dialect: 'mysql',
      define: {
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci"
		  },
			// replication: {},
	  }
  );
	
	const modelDefiners: (
		(sequelize: Sequelize) => 
			| UserStatic
			| TokenStatic
			| TaskStatic
			| StateStatic
			| OvertimeStatic
			| MomentStatic
			| HolidayStatic
			| ChannelStatic
			| AttenStatic
			| AlarmStatic
			| AddHolidayStatic
		)[] = [
		userTable,
		tokenTable,
		taskTable,
		stateTable,
		overtimeTable,
		momentTable,
		holidayTable,
		channelTable,
		attenTable,
		alarmTable,
		addHolidayTable
	];
	
	for (const modelDefiner of modelDefiners) {
		modelDefiner(sequelize);
	}
	
	const { 
		user,
		token,
		task,
		state,
		overtime,
		holiday,
		atten,
		alarm,
		addHoliday
	} = sequelize.models;

	user.hasMany(task);
	user.hasMany(overtime);
	user.hasMany(holiday);
	user.hasMany(atten);
	user.hasMany(addHoliday);

	user.hasOne(token);
	user.hasOne(state);
	user.hasOne(alarm);

	task.belongsTo(user, { foreignKey: "slack" });
	overtime.belongsTo(user, { foreignKey: "slack" });
	holiday.belongsTo(user, { foreignKey: "slack" });
	atten.belongsTo(user, { foreignKey: "slack" });
	addHoliday.belongsTo(user, { foreignKey: "slack" });

	token.belongsTo(user, { foreignKey: "slack" });
	state.belongsTo(user, { foreignKey: "slack" });
	alarm.belongsTo(user, { foreignKey: "slack" });
} catch(err) {
	console.log("mysql database connect error:", err);
	process.exit(1);
}

export default sequelize;