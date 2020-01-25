import {createMuiTheme} from '@material-ui/core/styles';
import {red} from '@material-ui/core/colors';

// Create a theme instance.
const theme = createMuiTheme({
	type: 'dark',
	palette: {
		primary: {
			main: '#1b5e20',
			light: '#4c8c4a',
			dark: '#003300',
			contrastText: '#fff'
		},
		secondary: {
			main: '#006064',
			light: '#428e92',
			dark: '#00363a',
			contrastText: '#fff'
		},
		error: {
			main: red.A400
		},
		background: {
			default: '#fff'
		}
	}
});

export default theme;
