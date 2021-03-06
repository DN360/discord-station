/* eslint camelcase: ["error", {properties: "never"}] */

'use strict';
module.exports = {
	up: (queryInterface, Sequelize) => {
		return queryInterface.createTable('pics', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			path: {
				type: Sequelize.STRING,
				unique: true
			},
			user_id: {
				type: Sequelize.INTEGER
			},
			album_id: {
				type: Sequelize.INTEGER
			},
			created_at: {
				allowNull: false,
				type: Sequelize.DATE
			},
			updated_at: {
				allowNull: false,
				type: Sequelize.DATE
			}
		});
	},
	down: queryInterface => {
		return queryInterface.dropTable('pics');
	}
};
