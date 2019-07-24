import React from 'react';
import {configureStore} from 'redux-starter-kit';
import {Provider} from 'react-redux';
import Container from '@material-ui/core/Container';
import App, {Container as NextContainer} from 'next/app';
import {ThemeProvider} from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import withRedux from 'next-redux-wrapper';
import {reducer as rootReducer} from '../ducks';
import theme from './src/theme';

class MyApp extends App {
	static async getInitialProps({Component, ctx}) {
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
}

export default withRedux(initialState =>
	configureStore({
		reducer: rootReducer,
		preloadedState: initialState,
		devTools: process.env.NODE_ENV !== 'production'
	})
)(MyApp);
