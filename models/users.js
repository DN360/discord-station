/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint new-cap: ["error", {properties: false}] */
'use strict';
module.exports = (sequelize, DataTypes) => {
	const users = sequelize.define('users', {
		name: DataTypes.STRING,
		email: DataTypes.STRING,
		password: DataTypes.STRING,
		uuid: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4
		},
		status: DataTypes.ENUM('valid', 'invalid', 'admin', 'progress'),
		pic_id: DataTypes.INTEGER,
		created_at: DataTypes.DATE,
		updated_at: DataTypes.DATE
	}, {
		underscored: true
	});
	users.associate = function (models) {
		// Associations can be defined here
		users.belongsTo(models.pics, {
			sourceKey: 'pic_id',
			targetKey: 'id'
		});
		users.hasMany(models.songs, {
			sourceKey: 'id',
			targetKey: 'user_id'
		});
	};

	return users;
};
