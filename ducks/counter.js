// Action type
const INCREMENT = 'COUNTER_INCREMENT';
const DECREMENT = 'COUNTER_DECREMENT';

const initialState = {
	count: 0
};

// Reducer
export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INCREMENT:
			return {
				...state,
				count: state.count + 1
			};

		case DECREMENT:
			return {
				...state,
				count: state.count - 1
			};

		default:
			return state;
	}
}

// Action-creator
export function increment() {
	return {type: INCREMENT};
}

export function decrement() {
	return {type: DECREMENT};
}
