const KoaRouter = require('koa-router');

const router = new KoaRouter();

const login = async ctx => {
	if (ctx.request.type !== 'application/json') {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'To login, please post body as json'
		};
		return;
	}

	const {username, password} = ctx.request.body;
	if (username === undefined || password === undefined) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'Invalid username or password'
		};
		return;
	}

	const userData = await ctx.models.users.findOne({
		where: {
			name: username
		},
		attributes: ['name', 'password', 'id', 'status']
	});
	if (!userData) {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'Invalid username or password'
		};
		return;
	}

	const hashedPassword = ctx.helper.passwordHash(password);
	/* eslint camelcase: ["error", {properties: "never"}] */
	if (hashedPassword === userData.password) {
		ctx.session.is_logged_in = true;
		ctx.session.user_id = userData.id;
		ctx.session.is_admin = userData.status === 'admin';
		ctx.status = 200;
		ctx.body = {
			status: 'success',
			message: 'OK'
		};
	} else {
		ctx.status = 400;
		ctx.body = {
			status: 'error',
			message: 'Invalid username or password'
		};
	}
};

const logout = async ctx => {
	ctx.session.is_logged_in = undefined;
	ctx.session.user_id = undefined;
	ctx.session.is_admin = undefined;
	ctx.redirect('/login');
};

router.post('/', login);
router.get('/logout', logout);

module.exports = router;

