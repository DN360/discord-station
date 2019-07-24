import React from 'react';
import {connect} from 'react-redux';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import * as counterModule from '../ducks/counter';

const App = props => {
	return (
		<div>
			<Button onClick={props.increment}>てすと</Button>
			<div>{props.count}</div>
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
		...state.counter
	};
};

const mapDispatchToProps = dispatch => {
	return {
		increment: () => dispatch(counterModule.increment()),
		decrement: () => dispatch(counterModule.decrement())
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

