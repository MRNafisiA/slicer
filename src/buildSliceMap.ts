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
                { order, map },
                {
                    payload: { id, initialState = rootSlice.getInitialState() }
                }: PayloadAction<{
                    id: string;
                    initialState?: GetStateFromSliceOrCombinedSliceOrSliceMap<S>;
                }>
            ) => ({
                order: order.includes(id) ? order : [...order, id],
                map: { ...map, [id as any]: initialState }
            }),
            remove: ({ order, map }, { payload: id }: PayloadAction<string>) => ({
                order: order
                    .filter(v => v !== id),
                map: Object.fromEntries(Object.entries(map).filter(([key]) => key !== id))
            }),
            keep: ({ order, map }, { payload: ids }: PayloadAction<string[]>) => ({
                order: order.filter(v => ids.includes(v)),
                map: Object.fromEntries(Object.entries(map).filter(([key]) => ids.includes(key)))
            }),
            setOrder: ({ map }, { payload: ids }: PayloadAction<string[]>) => ({ order: ids, map })
        },
        extraReducers: builder =>
            builder.addMatcher(
                action => action.type.startsWith(sliceName),
                ({ order, map }, { type, payload: { id, data } }) => ({
                    order, map: {
                        ...map,
                        [id]: rootSlice.reducer(map[id] as any, {
                            type,
                            payload: data
                        })
                    }
                })
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
