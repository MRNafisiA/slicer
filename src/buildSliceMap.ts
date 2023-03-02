import { isCombinedSlice, isSliceMap } from './buildSlice';
import { createSlice, Dispatch, PayloadAction, Slice } from '@reduxjs/toolkit';
import {
    CombinedSlice,
    CombinedVariableMaterials,
    GetStateFromSliceOrCombinedSliceOrSliceMap,
    MapVariableMaterials,
    SliceMap,
    SliceMapState,
    VariableMaterials
} from './types';

type GetVariableMaterialsFunc<S extends Slice | CombinedSlice | SliceMap> = (
    dispatch: Dispatch,
    selector: (
        state: any
    ) => SliceMapState<GetStateFromSliceOrCombinedSliceOrSliceMap<S>>,
    id: string
) => S extends Slice
    ? VariableMaterials<S>
    : S extends CombinedSlice
        ? CombinedVariableMaterials<S>
        : S extends SliceMap
            ? MapVariableMaterials<S>
            : never;

const buildSliceMap = <S extends Slice | CombinedSlice | SliceMap>(
    name: string,
    buildSlice: (name: string) => S,
    initialState: Record<
        string,
        GetStateFromSliceOrCombinedSliceOrSliceMap<S>
    > = {}
) => {
    const sliceName = name + '[MAPPED]';
    const baseSlice = buildSlice(sliceName);
    const rootSlice = (
        isCombinedSlice(baseSlice)
            ? baseSlice.rootSlice
            : isSliceMap(baseSlice)
                ? baseSlice.slice
                : baseSlice
    ) as S extends Slice
        ? S
        : S extends CombinedSlice
            ? S['rootSlice']
            : S extends SliceMap
                ? S['slice']
                : never;
    const slice = createSlice({
        name: sliceName,
        initialState: { order: Object.keys(initialState), map: initialState },
        reducers: {
            add: (
                state,
                {
                    payload: { id, initialState = rootSlice.getInitialState() }
                }: PayloadAction<{
                    id: string;
                    initialState?: GetStateFromSliceOrCombinedSliceOrSliceMap<S>;
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
                action => action.type.startsWith(sliceName),
                (state, action) => {
                    const response = rootSlice.reducer(state.map[action.payload.id] as any, {
                        type: action.type,
                        payload: action.payload.data
                    });

                    if (process.env.NODE_ENV !== 'production') {
                        console.log(`sliceMap\t ${name}`);
                        console.log(response);
                    }
                    return response;
                }
            )
    });

    if (isCombinedSlice(baseSlice)) {
        return {
            slice,
            getVariableMaterials: ((dispatch, selector, id) => ({
                slices: baseSlice,
                dispatch: action => {
                    if (action.type.startsWith(sliceName + '/')) {
                        dispatch({
                            type: action.type,
                            payload: { id, data: action.payload }
                        });
                    } else {
                        dispatch(action);
                    }
                },
                selector: state => selector(state).map[id]
            })) as GetVariableMaterialsFunc<S>
        };
    } else if (isSliceMap(baseSlice)) {
        return {
            slice,
            getVariableMaterials: ((dispatch, selector, id) => ({
                sliceMap: baseSlice,
                dispatch: action => {
                    if (action.type.startsWith(sliceName + '/')) {
                        dispatch({
                            type: action.type,
                            payload: { id, data: action.payload }
                        });
                    } else {
                        dispatch(action);
                    }
                },
                selector: state => selector(state).map[id] as SliceMapState<any>
            })) as GetVariableMaterialsFunc<S>
        };
    } else {
        return {
            slice,
            getVariableMaterials: ((dispatch, selector, id) => ({
                actions: baseSlice.actions,
                dispatch: action => {
                    if (action.type.startsWith(sliceName + '/')) {
                        dispatch({
                            type: action.type,
                            payload: { id, data: action.payload }
                        });
                    } else {
                        dispatch(action);
                    }
                },
                selector: state => selector(state).map[id]
            })) as GetVariableMaterialsFunc<S>
        };
    }
};

export { buildSliceMap };
