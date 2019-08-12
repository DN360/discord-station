// Action type
const UPDATE = 'SONG_UPDATE';

const initialState = {
	songList: []
};

// Reducer
export default function reducer(state = initialState, action) {
	switch (action.type) {
		case UPDATE:
			return {
				...state,
				songList: action.data
			};
		default:
			return state;
	}
}

// Action-creator
export function update(songList) {
	return {type: UPDATE, data: songList};
}
