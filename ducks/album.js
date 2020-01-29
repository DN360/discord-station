// Action type
const UPDATE = 'ALBUM_UPDATE';

const initialState = {
	albumList: []
};

// Reducer
export default function reducer(state, action) {
	state = state || initialState;
	switch (action.type) {
		case UPDATE:
			return {
				...state,
				albumList: action.data
			};
		default:
			return state;
	}
}

// Action-creator
export function update(albumList) {
	return {type: UPDATE, data: albumList};
}
