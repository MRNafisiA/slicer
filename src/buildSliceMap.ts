import { isCombinedSlice } from './buildSlice';
import { createSlice, Dispatch, PayloadAction, Slice } from '@reduxjs/toolkit';
import {
    CombinedSlice,
    CombinedVariableMaterials,
    GetStateFromSliceOrCombinedSlice,
    SliceMapState,
    VariableMaterials
} from './types';

type GetVariableMaterials<S extends Slice | CombinedSlice> = (
    dispatch: Dispatch,
    selector: (
        state: any
    ) => SliceMapState<GetStateFromSliceOrCombinedSlice<S>>,
    id: string
) => S extends Slice
    ? VariableMaterials<S>
    : S extends CombinedSlice
    ? CombinedVariableMaterials<S>
    : never;

const buildSliceMap = <S extends Slice | CombinedSlice>(
    name: string,
    buildSlice: (name: string) => S,
    initialState: Record<string, GetStateFromSliceOrCombinedSlice<S>> = {}
) => {
    const baseSlice = buildSlice(name + '[MAPPED]');
    const rootSlice = (
        isCombinedSlice(baseSlice) ? baseSlice.rootSlice : baseSlice
    ) as S extends Slice ? S : S extends CombinedSlice ? S['rootSlice'] : never;
    const slice = createSlice({
        name: name + '[MAPPED]',
        initialState: { order: Object.keys(initialState), map: initialState },
        reducers: {
            add: (
                state,
                {
                    payload: { id, initialState = rootSlice.getInitialState() }
                }: PayloadAction<{
                    id: string;
                    initialState?: GetStateFromSliceOrCombinedSlice<S>;
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
                    rootSlice.reducer(state.map[action.payload.id] as any, {
                        type: action.type,
                        payload: action.payload.data
                    });
                }
            )
    });

    if (isCombinedSlice(baseSlice)) {
        return {
            slice,
            getVariableMaterials: ((dispatch, selector, id) => ({
                slices: baseSlice,
                dispatch: action =>
                    dispatch({
                        type: action.type,
                        payload: { id, data: action.payload }
                    }),
                selector: state => selector(state).map[id]
            })) as GetVariableMaterials<S>
        };
    } else {
        return {
            slice,
            getVariableMaterials: ((dispatch, selector, id) => ({
                actions: baseSlice.actions,
                dispatch: action =>
                    dispatch({
                        type: action.type,
                        payload: { id, data: action.payload }
                    }),
                selector: state => selector(state).map[id]
            })) as GetVariableMaterials<S>
        };
    }
};

export { buildSliceMap };
