/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = (sequelize, DataTypes) => {
	const pics = sequelize.define('pics', {
		path: DataTypes.STRING,
		album_id: DataTypes.INTEGER
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
