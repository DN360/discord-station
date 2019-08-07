/* global document */

import React from 'react';
import {configureStore} from 'redux-starter-kit';
import {Provider} from 'react-redux';
import Container from '@material-ui/core/Container';
import App, {Container as NextContainer} from 'next/app';
import {ThemeProvider} from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import withRedux from 'next-redux-wrapper';
import {reducer as rootReducer} from '../ducks';
import * as authModule from '../ducks/auth';
import theme from './src/theme';

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
			<NextContainer>
				<ThemeProvider theme={theme}>
					<CssBaseline/>
					<Provider store={store}>
						<Container>
							<Component {...pageProps}/>
						</Container>
					</Provider>
				</ThemeProvider>
			</NextContainer>
		);
	}

	componentDidMount() {
		// Remove the server-side injected CSS.
		const jssStyles = document.querySelector('#jss-server-side');
		if (jssStyles) {
			jssStyles.parentNode.removeChild(jssStyles);
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
