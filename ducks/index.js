import {combineReducers} from 'redux';
import counterReducer from './counter';
import authReducer from './auth';
import songReducer from './song';
import playerReducer from './player';

const rootReducer = combineReducers({
	counter: counterReducer,
	auth: authReducer,
	song: songReducer,
	player: playerReducer
});

export const reducer = rootReducer;
