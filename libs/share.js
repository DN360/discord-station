const fs = require('fs');
const path = require('path');
let appConfig = require('../config/app.config.json');
const appConfigSample = require('../config/app.config.sample');

for (const configKey of Object.keys(appConfigSample)) {
	if (!appConfig[configKey]) {
		appConfig = {
			...appConfigSample,
			...appConfig
		};
		fs.writeFileSync(path.resolve(__dirname, '..', 'config', 'app.config.json'), JSON.stringify(appConfig));
	}
}

module.exports = {
	...appConfig
};
