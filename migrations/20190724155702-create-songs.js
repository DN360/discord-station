/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable('songs', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			name: {
				type: Sequelize.STRING,
				unique: 'name_artist_album'
			},
			artist_id: {
				type: Sequelize.INTEGER,
				unique: 'name_artist_album'
			},
			album_id: {
				type: Sequelize.INTEGER,
				unique: 'name_artist_album'
			},
			pic_id: {
				type: Sequelize.INTEGER
			},
			path: {
				type: Sequelize.TEXT
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE
			}
		}, {
			uniqueKeys: {
				name_artist_album: {
					fields: ['name', 'artist_id', 'album_id']
				}
			}
		});
	},
	down: queryInterface => {
		return queryInterface.dropTable('songs');
	}
};
