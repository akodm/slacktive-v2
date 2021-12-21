import { Sequelize } from 'sequelize';

import { AddHolidayStatic, addHolidayTable } from './models/addHoliday';
import { TemporaryStatic, temporaryTable } from './models/temporary';
import { OvertimeStatic, overtimeTable } from './models/overtime';
import { ChannelStatic, channelTable } from './models/channel';
import { HolidayStatic, holidayTable } from './models/holiday';
import { MomentStatic, momentTable } from './models/moment';
import { AlarmStatic, alarmTable } from './models/alarm';
import { AttenStatic, attenTable } from './models/atten';
import { StateStatic, stateTable } from './models/state';
import { TokenStatic, tokenTable } from './models/token';
import { TaskStatic, taskTable } from './models/task';
import { UserStatic, userTable } from './models/user';

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
			| TemporaryStatic
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
		addHolidayTable,
		temporaryTable
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

	user.hasMany(task, { foreignKey: "slack", sourceKey: "slack" });
	user.hasMany(overtime, { foreignKey: "slack", sourceKey: "slack" });
	user.hasMany(holiday, { foreignKey: "slack", sourceKey: "slack" });
	user.hasMany(atten, { foreignKey: "slack", sourceKey: "slack" });
	user.hasMany(addHoliday, { foreignKey: "slack", sourceKey: "slack" });

	user.hasOne(token, { foreignKey: "slack", sourceKey: "slack" });
	user.hasOne(state, { foreignKey: "slack", sourceKey: "slack" });
	user.hasOne(alarm, { foreignKey: "slack", sourceKey: "slack" });

	task.belongsTo(user, { foreignKey: "slack", targetKey: "slack" });
	overtime.belongsTo(user, { foreignKey: "slack", targetKey: "slack" });
	holiday.belongsTo(user, { foreignKey: "slack", targetKey: "slack" });
	atten.belongsTo(user, { foreignKey: "slack", targetKey: "slack" });
	addHoliday.belongsTo(user, { foreignKey: "slack", targetKey: "slack" });

	token.belongsTo(user, { foreignKey: "slack", targetKey: "slack" });
	state.belongsTo(user, { foreignKey: "slack", targetKey: "slack" });
	alarm.belongsTo(user, { foreignKey: "slack", targetKey: "slack" });

	overtime.belongsTo(atten, { foreignKey: "startDataId", targetKey: "id" });
	overtime.belongsTo(atten, { foreignKey: "endDataId", targetKey: "id" });
} catch(err) {
	console.log("mysql database connect error:", err);
	process.exit(1);
}

export default sequelize;