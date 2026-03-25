const db = require('../config/database');

const User = require('./User')(db.sequelize, db.Sequelize.DataTypes);
const Merchant = require('./Merchant')(db.sequelize, db.Sequelize.DataTypes);
const Organizer = require('./Organizer')(db.sequelize, db.Sequelize.DataTypes);
const Exhibition = require('./Exhibition')(db.sequelize, db.Sequelize.DataTypes);
const Connection = require('./Connection')(db.sequelize, db.Sequelize.DataTypes);
const Material = require('./Material')(db.sequelize, db.Sequelize.DataTypes);
const VirtualRoom = require('./VirtualRoom')(db.sequelize, db.Sequelize.DataTypes);
const ChatRecord = require('./ChatRecord')(db.sequelize, db.Sequelize.DataTypes);
const Activity = require('./Activity')(db.sequelize, db.Sequelize.DataTypes);
const Prize = require('./Prize')(db.sequelize, db.Sequelize.DataTypes);
const Quota = require('./Quota')(db.sequelize, db.Sequelize.DataTypes);
const AIRecommendation = require('./AIRecommendation')(db.sequelize, db.Sequelize.DataTypes);
const UserPreference = require('./UserPreference')(db.sequelize, db.Sequelize.DataTypes);
const Permission = require('./Permission')(db.sequelize, db.Sequelize.DataTypes);
const Package = require('./Package')(db.sequelize, db.Sequelize.DataTypes);
const Role = require('./Role')(db.sequelize, db.Sequelize.DataTypes);
const RolePermission = require('./RolePermission')(db.sequelize, db.Sequelize.DataTypes);
const MiniprogramPublish = require('./MiniprogramPublish')(db.sequelize, db.Sequelize.DataTypes);
const Teacher = require('./Teacher')(db.sequelize, db.Sequelize.DataTypes);

User.belongsTo(Organizer, { foreignKey: 'organizerId', as: 'organizer' });
User.belongsTo(Exhibition, { foreignKey: 'exhibitionId', as: 'exhibition' });

Merchant.belongsTo(Organizer, { foreignKey: 'organizerId', as: 'organizer' });
Merchant.belongsTo(Exhibition, { foreignKey: 'exhibitionId', as: 'exhibition' });
Merchant.hasMany(Connection, { foreignKey: 'merchantId', as: 'connections' });
Merchant.hasMany(Material, { foreignKey: 'merchantId', as: 'materials' });
Merchant.hasOne(VirtualRoom, { foreignKey: 'merchantId', as: 'virtualRoom' });

Exhibition.belongsTo(Organizer, { foreignKey: 'organizerId', as: 'organizer' });
Exhibition.hasMany(User, { foreignKey: 'exhibitionId', as: 'users' });
Exhibition.hasMany(Merchant, { foreignKey: 'exhibitionId', as: 'merchants' });
Exhibition.hasMany(Activity, { foreignKey: 'exhibitionId', as: 'activities' });

Connection.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Connection.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

Material.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

VirtualRoom.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
VirtualRoom.belongsTo(Exhibition, { foreignKey: 'exhibitionId', as: 'exhibition' });

ChatRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ChatRecord.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
ChatRecord.belongsTo(VirtualRoom, { foreignKey: 'roomId', as: 'room' });

Activity.belongsTo(Exhibition, { foreignKey: 'exhibitionId', as: 'exhibition' });
Activity.hasMany(Prize, { foreignKey: 'activityId', as: 'prizes' });

Prize.belongsTo(Activity, { foreignKey: 'activityId', as: 'activity' });

Quota.belongsTo(Organizer, { foreignKey: 'organizerId', as: 'organizer' });
Quota.belongsTo(Exhibition, { foreignKey: 'exhibitionId', as: 'exhibition' });

AIRecommendation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AIRecommendation.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });

UserPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});

db.User = User;
db.Merchant = Merchant;
db.Organizer = Organizer;
db.Exhibition = Exhibition;
db.Connection = Connection;
db.Material = Material;
db.VirtualRoom = VirtualRoom;
db.ChatRecord = ChatRecord;
db.Activity = Activity;
db.Prize = Prize;
db.Quota = Quota;
db.AIRecommendation = AIRecommendation;
db.UserPreference = UserPreference;
db.Permission = Permission;
db.Package = Package;
db.Role = Role;
db.RolePermission = RolePermission;
db.MiniprogramPublish = MiniprogramPublish;
db.Teacher = Teacher;

module.exports = db;
