/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = (sequelize, DataTypes) => {
	const songs = sequelize.define('songs', {
		name: DataTypes.STRING,
		artist_id: DataTypes.INTEGER,
		album_id: DataTypes.INTEGER,
		pic_id: DataTypes.INTEGER,
		path: DataTypes.TEXT,
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
	};

	return songs;
};
