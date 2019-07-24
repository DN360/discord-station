const KoaRouter = require('koa-router');
const songRouter = require('./song');

const router = new KoaRouter();

router.use('/song', songRouter.routes(), songRouter.allowedMethods())
	.all('*', ctx => {
		ctx.status = 501;
		ctx.body = {
			status: 'error',
			message: 'Not implemented'
		};
	});

module.exports = router;
