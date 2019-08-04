import React from 'react';
import {connect} from 'react-redux';
import Link from 'next/link';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import Router from 'next/router';
import * as counterModule from '../ducks/counter';

const App = props => {
	return (
		<div>
			<Button onClick={props.increment}>てすと</Button>
			<div>{props.count}</div>
			<Link href="/login"><a>ログイン画面へ</a></Link>
		</div>
	);
};

App.propTypes = {
	increment: PropTypes.func.isRequired,
	count: PropTypes.number
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
		decrement: () => dispatch(counterModule.decrement())
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

