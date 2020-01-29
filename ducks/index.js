import {combineReducers} from 'redux';
import counterReducer from './counter';
import authReducer from './auth';
import songReducer from './song';
import artistReducer from './artist';
import albumReducer from './album';
import queryReducer from './query';
import playerReducer from './player';

const rootReducer = combineReducers({
	counter: counterReducer,
	auth: authReducer,
	song: songReducer,
	artist: artistReducer,
	album: albumReducer,
	query: queryReducer,
	player: playerReducer
});

export const reducer = rootReducer;
