const fs = require('fs');
const path = require('path');
const KoaRouter = require('koa-router');
const mime = require('mime');
const apiRouter = require('./api');

const router = new KoaRouter();
router.use('/api/v1', apiRouter.routes(), apiRouter.allowedMethods())
	.all('/src*', async ctx => {
		ctx.status = 403;
		ctx.body = {
			status: 'error',
			message: 'Direct load source is strictly prohibited.'
		};
	})
	.get('/assets*', async ctx => {
		ctx.status = 200;
		const filePath = path.resolve(__dirname, '..', 'assets', ctx.request.path.replace(/^\/assets\//, ''));
		if (fs.existsSync(filePath)) {
			ctx.type = mime.getType(filePath);
			ctx.body = fs.createReadStream(filePath);
		} else {
			ctx.status = 404;
			ctx.body = {
				status: 'error',
				message: 'not found'
			};
		}
	})
	.get('/artist', async ctx => {
		ctx.req.isLoggedIn = ctx.session.is_logged_in;
		ctx.req.isAdmin = ctx.session.is_admin;
		ctx.req.userId = ctx.session.user_id;
		await ctx.nextApp.render(ctx.req, ctx.res, '/artist-list');
	})
	.get('/album', async ctx => {
		ctx.req.isLoggedIn = ctx.session.is_logged_in;
		ctx.req.isAdmin = ctx.session.is_admin;
		ctx.req.userId = ctx.session.user_id;
		await ctx.nextApp.render(ctx.req, ctx.res, '/album-list');
	})
	.get('/artist/:id', async ctx => {
		ctx.req.isLoggedIn = ctx.session.is_logged_in;
		ctx.req.isAdmin = ctx.session.is_admin;
		ctx.req.userId = ctx.session.user_id;
		const renderPage = Number(ctx.params.id) ? '/artist' : '/artist-list'
		await ctx.nextApp.render(ctx.req, ctx.res, renderPage, {
			id: Number(ctx.params.id)
		});
		ctx.respond = false;
	})
	.get('/album/:id', async ctx => {
		console.log(ctx.params)
		ctx.req.isLoggedIn = ctx.session.is_logged_in;
		ctx.req.isAdmin = ctx.session.is_admin;
		ctx.req.userId = ctx.session.user_id;
		const renderPage = Number(ctx.params.id) ? '/album' : '/album-list'
		await ctx.nextApp.render(ctx.req, ctx.res, renderPage, {
			id: Number(ctx.params.id)
		});
		ctx.respond = false;
	})
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
