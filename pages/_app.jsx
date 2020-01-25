/* global document */

import React from 'react';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import Container from '@material-ui/core/Container';
import App from 'next/app';
import {ThemeProvider} from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import withRedux from 'next-redux-wrapper';
import {reducer as rootReducer} from '../ducks';
import * as authModule from '../ducks/auth';
import theme from './src/theme';
import AppBar from './src/app-bar.jsx';
import PlayerBar from './src/player-bar.jsx';

class MyApp extends App {
	static async getInitialProps({Component, ctx}) {
		if (ctx.req) {
			ctx.store.dispatch(authModule.initial(ctx.req.isLoggedIn, ctx.req.isAdmin, ctx.req.userId));
		}

		const pageProps = Component.getInitialProps ?
			await Component.getInitialProps(ctx) :
			{};

		return {pageProps};
	}

	render() {
		const {Component, pageProps, store} = this.props;
		return (
			<ThemeProvider theme={theme}>
				<CssBaseline/>
				<Provider store={store}>
					<Container maxWidth="xl">
						<AppBar/>
						<Component {...pageProps}/>
						<PlayerBar/>
					</Container>
				</Provider>
			</ThemeProvider>
		);
	}

	componentDidMount() {
		// Remove the server-side injected CSS.
		const jssStyles = document.querySelector('#jss-server-side');
		if (jssStyles) {
			jssStyles.remove();
		}
	}
}

export default withRedux(initialState =>
	configureStore({
		reducer: rootReducer,
		preloadedState: initialState,
		devTools: process.env.NODE_ENV !== 'production'
	})
)(MyApp);
