/* eslint complexity: 0 */
// Action type
const PLAY = 'PLAYER_PLAY';
const STOP = 'PLAYER_STOP';
const PAUSE = 'PLAYER_PAUSE';
const REPLAY = 'PLAYER_REPLAY';
const SKIPNEXT = 'PLAYER_SKIPNEXT';
const SKIPPREV = 'PLAYER_SKIPPREV';
const SETCUE = 'PLAYER_SETCUE';
const SETCUELIST = 'PLAYER_SETCUELIST';
const GETCUE = 'PLAYER_GETCUE';
const SHUFFLE = 'PLAYER_SHUFFLE';
const REPEAT = 'PLAYER_REPEAT';

const statusEnum = {
	play: 'play',
	pause: 'pause',
	stop: 'stop'
};

const initialState = {
	cueList: [],
	cueIndex: -1,
	repeat: false,
	noShuffleCueList: [],
	shuffle: false,
	status: statusEnum.stop
};

// Reducer
export default function reducer(state, action) {
	state = state || initialState;
	switch (action.type) {
		case PLAY: {
			if (action.data === undefined || (state.cueList.slice(-1)[0] && state.cueList.slice(-1)[0].id === action.data.id)) {
				return {
					...state,
					status: state.cueList.length === 0 ? statusEnum.stop : statusEnum.play
				};
			}

			const newCueList = [
				...state.cueList,
				action.data
			];

			return {
				...state,
				cueList: newCueList,
				cueIndex: state.cueList.length,
				status: newCueList.length === 0 ? statusEnum.stop : statusEnum.play
			};
		}

		case PAUSE:
			return {
				...state,
				status: statusEnum.pause
			};
		case STOP:
			return {
				...state,
				status: statusEnum.stop
			};
		case REPLAY:
			return {
				...state,
				status: statusEnum.replay
			};
		case SETCUE:
			return {
				...state,
				cueList: [
					...state.cueList,
					action.data
				]
			};
		case SETCUELIST: {
			let newList = [];
			let nextCueIndex = action.index;
			if (state.shuffle) {
				const prevSongIdByCueIndex = action.list[nextCueIndex] ? action.list[nextCueIndex].id : -1;
				newList = action.list.map(x => [Math.random(), x]).sort().map(x => x[1]);
				nextCueIndex = prevSongIdByCueIndex >= 0 ? newList.findIndex(x => x.id === prevSongIdByCueIndex) : 0;
			} else {
				newList = action.list;
			}

			return {
				...state,
				cueList: [...newList],
				noShuffleCueList: [...action.list],
				cueIndex: nextCueIndex
			};
		}

		case REPEAT:
			return {
				...state,
				repeat: !state.repeat
			};
		case SHUFFLE: {
			if (state.shuffle) {
				const nowPlayingCue = state.cueList[state.cueIndex];
				const nextCueIndex = state.noShuffleCueList.findIndex(x => x.id === nowPlayingCue.id);
				return {
					...state,
					cueList: state.noShuffleCueList.slice(),
					cueIndex: nextCueIndex,
					noShuffleCueList: [],
					shuffle: false
				};
			}

			const shuffledList = state.cueList.slice().map((x, i) => i === state.cueIndex ? ({...x, hasTargetIndex: true}) : x).map(x => [Math.random(), x]).sort().map(x => x[1]);
			const nextCueIndex = shuffledList.findIndex(x => x.hasTargetIndex);
			return {
				...state,
				cueList: shuffledList,
				cueIndex: nextCueIndex,
				noShuffleCueList: state.cueList.slice(),
				shuffle: true
			};
		}

		case SKIPNEXT: {
			let nextStatus = 'play';
			const nextCueIndex = state.cueIndex + 1 >= state.cueList.length ? (
				state.repeat ? 0 : state.cueList.length - 1
			) : state.cueIndex + 1;
			if (state.cueIndex + 1 >= state.cueList.length) {
				if (state.repeat) {
					nextStatus = statusEnum.play;
				} else {
					nextStatus = statusEnum.stop;
				}
			}

			return {
				...state,
				cueIndex: nextCueIndex,
				status: nextStatus
			};
		}

		case SKIPPREV: {
			let nextStatus = 'play';
			const nextCueIndex = state.cueIndex - 1 < 0 ? (
				state.repeat ? state.cueList.length - 1 : 0
			) : state.cueIndex - 1;
			if (state.cueIndex - 1 < 0) {
				if (state.repeat) {
					nextStatus = statusEnum.play;
				} else {
					nextStatus = statusEnum.stop;
				}
			}

			return {
				...state,
				cueIndex: nextCueIndex,
				status: nextStatus
			};
		}

		default:
			return state;
	}
}

// Action-creator
export function play(songData) {
	return {type: PLAY, data: songData};
}

export function setCue(songData) {
	return {type: SETCUE, data: songData};
}

export function setCueList(songList, index = 0) {
	return {type: SETCUELIST, list: songList, index};
}

export function toggleRepeatMode() {
	return {type: REPEAT};
}

export function toggleShuffleMode() {
	return {type: SHUFFLE};
}

export function pause() {
	return {type: PAUSE};
}

export function stop() {
	return {type: STOP};
}

export function skipNext() {
	return {type: SKIPNEXT};
}

export function skipPrev() {
	return {type: SKIPPREV};
}

export const playerStatus = statusEnum;

