/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = (sequelize, DataTypes) => {
	const pics = sequelize.define('pics', {
		path: DataTypes.STRING,
		user_id: DataTypes.INTEGER,
		album_id: DataTypes.INTEGER,
		created_at: DataTypes.DATE,
		updated_at: DataTypes.DATE
	}, {
		underscored: true
	});
	pics.associate = function (models) {
		// Associations can be defined here
		pics.hasMany(models.songs, {
			sourceKey: 'id',
			targetKey: 'pic_id'
		});
		pics.belongsTo(models.albums, {
			sourceKey: 'album_id',
			targetKey: 'id'
		});
	};

	return pics;
};
