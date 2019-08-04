/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint new-cap: ["error", {properties: false}] */

'use strict';
module.exports = (sequelize, DataTypes) => {
	const songs = sequelize.define('songs', {
		name: DataTypes.STRING,
		artist_id: DataTypes.INTEGER,
		album_id: DataTypes.INTEGER,
		pic_id: DataTypes.INTEGER,
		user_id: DataTypes.INTEGER,
		path: DataTypes.TEXT,
		status: DataTypes.ENUM('create', 'ready', 'invalid'),
		created_at: DataTypes.DATE,
		updated_at: DataTypes.DATE
	}, {
		underscored: true
	});
	songs.associate = function (models) {
		// Associations can be defined here
		songs.belongsTo(models.artists, {
			sourceKey: 'artist_id',
			targetKey: 'id'
		});
		songs.belongsTo(models.albums, {
			sourceKey: 'album_id',
			targetKey: 'id'
		});
		songs.belongsTo(models.pics, {
			sourceKey: 'pic_id',
			targetKey: 'id'
		});
		songs.belongsTo(models.users, {
			sourceKey: 'user_id',
			targetKey: 'id'
		});
	};

	return songs;
};
