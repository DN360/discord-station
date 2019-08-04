const KoaRouter = require('koa-router');
const apiRouter = require('./api');

const router = new KoaRouter();
router.use('/api/v1', apiRouter.routes(), apiRouter.allowedMethods())
	.get('*', async ctx => {
		/* eslint camelcase: ["error", {properties: "never"}] */
		const handle = ctx.nextApp.getRequestHandler();
		ctx.req.isLoggedIn = ctx.session.is_logged_in;
		ctx.req.isAdmin = ctx.session.is_admin;
		ctx.req.userId = ctx.session.user_id;
		await handle(ctx.req, ctx.res);
	// Ctx.app.render(req, res, '/a', query);
	});

module.exports = router;
