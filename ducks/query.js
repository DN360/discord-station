
const NEXT_PAGE = 'QUERY_NEXT_PAGE';
const PAGE_END = 'QUERY_PAGE_END';

const initialState = {
	queryNextPage: '',
	queryPageEnd: true
};

// Reducer
export default function reducer(state, action) {
	state = state || initialState;
	switch (action.type) {
		case NEXT_PAGE:
			return {
				...state,
				queryNextPage: action.data
			};
		case PAGE_END:
			return {
				...state,
				queryPageEnd: action.data
			};
		default:
			return state;
	}
}

// Action-creator
export function nextPage(nextPage) {
	return {type: NEXT_PAGE, data: nextPage};
}

// Action-creator
export function pageEnd(pageEnd) {
	return {type: PAGE_END, data: pageEnd};
}
