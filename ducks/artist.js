// Action type
const UPDATE = 'ARTIST_UPDATE';

const initialState = {
	artistList: []
};

// Reducer
export default function reducer(state, action) {
	state = state || initialState;
	switch (action.type) {
		case UPDATE:
			return {
				...state,
				artistList: action.data
			};
		default:
			return state;
	}
}

// Action-creator
export function update(artistList) {
	return {type: UPDATE, data: artistList};
}
