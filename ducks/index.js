import {combineReducers} from 'redux';
import counterReducer from './counter';

const rootReducer = combineReducers({
	counter: counterReducer
});

export const reducer = rootReducer;
