const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const next = require('next');
const koaBody = require('koa-body');
const koaLogger = require('koa-logger');
const range = require('koa-range');
const log4js = require('log4js');
const session = require('koa-generic-session');
const SequelizeStore = require('koa-generic-session-sequelize');
const mkdirp = require('mkdirp');
const BPromise = require('bluebird');
const models = require('./models');
let appConfig = require('./config/app.config.json');
const appConfigSample = require('./config/app.config.sample');
const helper = require('./libs/helper');

for (const configKey of Object.keys(appConfigSample)) {
	if (!appConfig[configKey]) {
		appConfig = {
			...appConfigSample,
			...appConfig
		};
		fs.writeFileSync(path.resolve(__dirname, 'config', 'app.config.json'), JSON.stringify(appConfig));
	}
}

process.env = {
	...process.env,
	...appConfig
};

log4js.configure({
	appenders: {
		system: {type: 'stdout', filename: 'system.log'}
	},
	categories: {
		default: {appenders: ['system'], level: process.env.LOGLEVEL || 'debug'}
	}
});
const logger = log4js.getLogger('system');

const app = new Koa();
const nextApp = next({dev: process.env.NODE_ENV === 'development'});
const routes = require('./routes');

const sequelizeConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config', 'config.json')));

app.keys = ['discord-station', 'discord-station_secret'];

const start = async () => {
	await nextApp.prepare();

	const mkdirSync = path => BPromise.resolve(path).then(path => new BPromise((resolve, reject) => {
		mkdirp(path, err => {
			if (err) {
				reject(err);
			} else {
				resolve(path);
			}
		});
	}));
	await mkdirSync('./databases').catch(logger.error);
	await mkdirSync('./tmp').catch(logger.error);
	if (!fs.existsSync(sequelizeConfig[process.env.NODE_ENV].storage)) {
		fs.writeFileSync(sequelizeConfig[process.env.NODE_ENV].storage, '');
	}

	app
		.use(async (ctx, next) => {
			ctx.logger = logger;
			await next();
		})
		.use(async (ctx, next) => {
			try {
				await next();
			} catch (error) {
				ctx.logger.error(error);
			}
		})
		.use(koaLogger())
		.use(range)
		.use(koaBody({
			multipart: true,
			formidable: {
				uploadDir: path.resolve(__dirname, 'tmp'),
				maxFieldsSize: 100 * 1024 * 1024
			}
		}))
		.use(async (ctx, next) => {
			ctx.seq = models.sequelize;
			ctx.Seq = models.Sequelize;
			ctx.models = models.sequelize.models;
			ctx.nextApp = nextApp;
			ctx.helper = helper;
			ctx.helper.mkdirSync = mkdirSync;

			await next();
		})
		.use(session({
			store: new SequelizeStore(models.sequelize)
		}))
		.use(routes.routes())
		.use(routes.allowedMethods())
		.listen(process.env.PORT || 3000, () => {
			logger.info('listen on port 3000');
		});
};

start();

