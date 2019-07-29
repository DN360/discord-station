const Router = require('koa-router');

const router = new Router();

const getUserList = ctx => {
	if (!ctx.session.is_admin) {
		ctx.status = 403;
		ctx.body = {
			status: 'error',
			message: 'You can not access this API. Please check your privileges'
		};
	}
};

router.get('/', getUserList);

module.exports = router;
