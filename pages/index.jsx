import React from 'react';
import {connect} from 'react-redux';
import Link from 'next/link';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import Router from 'next/router';
import * as counterModule from '../ducks/counter';
import * as authModule from '../ducks/auth';

const App = props => {
	const logoutButtonOnClick = () => {
		fetch('/api/v1/auth/logout').then(() => {
			props.setAuth({isLoggedIn: false, isAdmin: false, userId: -1});
			Router.push('/login');
		});
	};

	return (
		<Box>
			<Button onClick={props.increment}>てすと</Button>
			<div>{props.count}</div>
			<Link href="/login"><a>ログイン画面へ</a></Link>
			<Button variant="contained" onClick={logoutButtonOnClick}>ログアウト</Button>
		</Box>
	);
};

App.propTypes = {
	increment: PropTypes.func.isRequired,
	count: PropTypes.number,
	setAuth: PropTypes.func.isRequired
};

App.defaultProps = {
	count: 0
};

const mapStateToProps = state => {
	return {
		...state.counter,
		...state.auth
	};
};

const mapDispatchToProps = dispatch => {
	return {
		increment: () => dispatch(counterModule.increment()),
		decrement: () => dispatch(counterModule.decrement()),
		setAuth: authProps => dispatch(authModule.initial(authProps.isLoggedIn, authProps.isAdmin, authProps.userId))
	};
};

App.getInitialProps = async ({store, req, res}) => {
	if (res) {
		if (!req.isLoggedIn) {
			res.writeHead(302, {
				Location: '/login'
			});
			res.end();
		}
	} else {
		const state = store.getState();
		if (!state.auth.isLoggedIn) {
			Router.push('/login');
		}
	}
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

