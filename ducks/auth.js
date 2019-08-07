// Action type
const INITIAL = 'INITIAL';

const initialState = {
	isLoggedIn: false,
	isAdmin: false,
	userId: -1
};

// Reducer
export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INITIAL:
			return {
				...state,
				isLoggedIn: action.isLoggedIn === undefined ? state.isLoggedIn : action.isLoggedIn,
				isAdmin: action.isAdmin === undefined ? state.isAdmin : action.isAdmin,
				userId: action.userId === undefined ? state.userId : action.userId
			};
		default:
			return state;
	}
}

// Action-creator
export function initial(isLoggedIn, isAdmin, userId) {
	return {type: INITIAL, isAdmin, isLoggedIn, userId};
}
