import { createSlice, Dispatch, PayloadAction, Slice } from '@reduxjs/toolkit';
import {
    CombinedSlice,
    CombinedVariableMaterials,
    GetStateFromCombinedSlice,
    GetStateFromSlice,
    SliceMapState,
    VariableMaterials
} from './types';

const buildSliceMap = <S extends Slice>(
    name: string,
    buildSlice: (name: string) => S,
    initialState: Record<string, GetStateFromSlice<S>> = {}
) => {
    const baseSlice = buildSlice(name + '[MAPPED]');
    const slice = createSlice({
        name: name + '[MAPPED]',
        initialState: { order: Object.keys(initialState), map: initialState },
        reducers: {
            add: (
                state,
                {
                    payload: { id, initialState = baseSlice.getInitialState() }
                }: PayloadAction<{
                    id: string;
                    initialState?: GetStateFromSlice<S>;
                }>
            ) => {
                state.map[id] = initialState as any;
                if (!state.order.includes(id)) {
                    state.order.push(id);
                }
            },
            remove: (state, { payload: id }: PayloadAction<string>) => {
                delete state.map[id];
                state.order.splice(state.order.indexOf(id), 1);
            },
            keep: (state, { payload: ids }: PayloadAction<string[]>) => {
                const removingIDs = Object.keys(state).filter(
                    v => !ids.includes(v)
                );
                for (const id of removingIDs) {
                    delete state.map[id];
                }
                state.order = state.order.filter(v => !removingIDs.includes(v));
            },
            setOrder: (state, { payload: ids }: PayloadAction<string[]>) => {
                state.order = ids;
            }
        },
        extraReducers: builder =>
            builder.addMatcher(
                action => action.type.startsWith(name + '[MAPPED]/'),
                (state, action) => {
                    baseSlice.reducer(state.map[action.payload.id] as any, {
                        type: action.type,
                        payload: action.payload.data
                    });
                }
            )
    });
    const dispatchMap: Record<string, Dispatch> = {};

    return {
        slice,
        getVariableMaterials: (
            dispatch: Dispatch,
            selector: (state: any) => SliceMapState<GetStateFromSlice<S>>,
            id: string
        ): VariableMaterials<S> => {
            if (dispatchMap[id] === undefined) {
                dispatchMap[id] = action =>
                    dispatch({
                        type: action.type,
                        payload: { id, data: action.payload }
                    }) as any;
            }
            return {
                actions: baseSlice.actions as any,
                dispatch: dispatchMap[id],
                selector: state => selector(state).map[id]
            };
        }
    };
};
const buildCombinedSliceMap = <S extends CombinedSlice>(
    name: string,
    buildSlice: (name: string) => S,
    initialState: Record<string, GetStateFromCombinedSlice<S>> = {}
) => {
    const baseSlice = buildSlice(name + '[MAPPED]');
    const slice = createSlice({
        name: name + '[MAPPED]',
        initialState: { order: Object.keys(initialState), map: initialState },
        reducers: {
            add: (
                state,
                {
                    payload: {
                        id,
                        initialState = baseSlice.rootSlice.getInitialState()
                    }
                }: PayloadAction<{
                    id: string;
                    initialState?: GetStateFromCombinedSlice<S>;
                }>
            ) => {
                state.map[id] = initialState as any;
                if (!state.order.includes(id)) {
                    state.order.push(id);
                }
            },
            remove: (state, { payload: id }: PayloadAction<string>) => {
                delete state.map[id];
                state.order.splice(state.order.indexOf(id), 1);
            },
            keep: (state, { payload: ids }: PayloadAction<string[]>) => {
                const removingIDs = Object.keys(state).filter(
                    v => !ids.includes(v)
                );
                for (const id of removingIDs) {
                    delete state.map[id];
                }
                state.order = state.order.filter(v => !removingIDs.includes(v));
            },
            setOrder: (state, { payload: ids }: PayloadAction<string[]>) => {
                state.order = ids;
            }
        },
        extraReducers: builder =>
            builder.addMatcher(
                action => action.type.startsWith(name + '[MAPPED]/'),
                (state, action) => {
                    baseSlice.rootSlice.reducer(
                        state.map[action.payload.id] as any,
                        {
                            type: action.type,
                            payload: action.payload.data
                        }
                    );
                }
            )
    });
    const dispatchMap: Record<string, Dispatch> = {};

    return {
        slice,
        getCombinedVariableMaterials: (
            dispatch: Dispatch,
            selector: (
                state: any
            ) => SliceMapState<GetStateFromCombinedSlice<S>>,
            id: string
        ): CombinedVariableMaterials<S> => {
            if (dispatchMap[id] === undefined) {
                dispatchMap[id] = action =>
                    dispatch({
                        type: action.type,
                        payload: { id, data: action.payload }
                    }) as any;
            }
            return {
                slices: baseSlice,
                selector: state => selector(state).map[id],
                dispatch: dispatchMap[id]
            };
        }
    };
};

export { buildSliceMap, buildCombinedSliceMap };
