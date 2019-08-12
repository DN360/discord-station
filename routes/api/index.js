const KoaRouter = require('koa-router');
const songRouter = require('./song');
const albumRouter = require('./album');
const artistRouter = require('./artist');
const authRouter = require('./auth');
const picRouter = require('./pic');
const userRouter = require('./user');

const router = new KoaRouter();

const loginCheck = async (ctx, next) => {
	if (ctx.session.is_logged_in) {
		await next();
	} else {
		ctx.status = 401;
		ctx.body = {
			status: 'error',
			message: 'need authorize'
		};
	}
};

router.use('/song', loginCheck, songRouter.routes(), songRouter.allowedMethods())
	.use('/artist', loginCheck, artistRouter.routes(), artistRouter.allowedMethods())
	.use('/pic', loginCheck, picRouter.routes(), picRouter.allowedMethods())
	.use('/album', loginCheck, albumRouter.routes(), albumRouter.allowedMethods())
	.use('/auth', authRouter.routes(), authRouter.allowedMethods())
	.use('/user', loginCheck, userRouter.routes(), userRouter.allowedMethods())
	.all('*', ctx => {
		ctx.status = 501;
		ctx.body = {
			status: 'error',
			message: 'Not implemented'
		};
	});

module.exports = router;
