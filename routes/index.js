const KoaRouter = require('koa-router');
const apiRouter = require('./api');

const router = new KoaRouter();
router.use('/api/v1', apiRouter.routes(), apiRouter.allowedMethods())
	.get('*', async ctx => {
		const handle = ctx.nextApp.getRequestHandler();
		await handle(ctx.req, ctx.res);
		ctx.respond = false;
	// Ctx.app.render(req, res, '/a', query);
	});

module.exports = router;
