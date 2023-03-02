import config from './config';
import {
    AggregateBuildSlices,
    CaseReducerFromState,
    CombinedSlice,
    SliceMap
} from './types';
import {
    Slice,
    CaseReducer,
    createSlice,
    PayloadAction
} from '@reduxjs/toolkit';

const isCombinedSlice = (
    sliceOrCombinedSliceOrSliceMap: Slice | CombinedSlice | SliceMap
): sliceOrCombinedSliceOrSliceMap is CombinedSlice =>
    (sliceOrCombinedSliceOrSliceMap as CombinedSlice).rootSlice !== undefined;
const isSliceMap = (
    sliceOrCombinedSliceOrSliceMap: Slice | CombinedSlice | SliceMap
): sliceOrCombinedSliceOrSliceMap is SliceMap =>
    (sliceOrCombinedSliceOrSliceMap as SliceMap).slice !== undefined;

const buildSimpleSlice = <State, Name extends string>(
    name: Name,
    initialState: State | (() => State)
) =>
    createSlice({
        name,
        initialState,
        reducers: {
            set: (_, { payload }) => {
                if (config.debug) {
                    console.log(`simpleSlice\t\t ${name}`);
                    console.log(JSON.parse(JSON.stringify(payload) ?? null));
                }
                return payload;
            }
        }
    }) as Slice<State, { set: CaseReducer<State, PayloadAction<State>> }, Name>;
const buildSlice = <State extends Record<string, unknown>, Name extends string>(
    name: Name,
    initialState: State | (() => State)
) =>
    createSlice({
        name,
        initialState,
        reducers: Object.fromEntries(
            Object.keys(
                typeof initialState === 'function'
                    ? initialState()
                    : initialState
            ).map(key => [
                key,
                (state, { payload }) => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    state[key] = payload;
                }
            ])
        )
    }) as Slice<State, CaseReducerFromState<State>, Name>;
const combineBuildSlices = <
    BuildSlices extends {
        [key: string]: (name: string) => Slice | CombinedSlice | SliceMap;
    }
>(
    name: string,
    buildSlices: BuildSlices
): {
    rootSlice: Slice<AggregateBuildSlices<BuildSlices>>;
    subSlices: {
        [key in keyof BuildSlices]: ReturnType<BuildSlices[key]>;
    };
} => {
    const subSlices = Object.fromEntries(
        Object.entries(buildSlices).map(([key, buildSlice]) => [
            key,
            buildSlice(`${name}/${key}`)
        ])
    ) as {
        [key in keyof BuildSlices]: ReturnType<BuildSlices[key]>;
    };
    const rootSlice = createSlice({
        name,
        initialState: Object.fromEntries(
            Object.entries(subSlices).map(([key, baseSlice]) => [
                key,
                (isCombinedSlice(baseSlice)
                        ? baseSlice.rootSlice
                        : isSliceMap(baseSlice)
                            ? baseSlice.slice
                            : baseSlice
                ).getInitialState()
            ])
        ) as AggregateBuildSlices<BuildSlices>,
        reducers: {},
        extraReducers: builder => {
            for (const key in subSlices) {
                builder.addMatcher(
                    ({ type }) => type.startsWith(`${name}/${key}`),
                    (state, action) => {
                        const baseSlice = subSlices[key];
                        const response = (isCombinedSlice(baseSlice)
                            ? baseSlice.rootSlice.reducer
                            : isSliceMap(baseSlice)
                                ? baseSlice.slice.reducer
                                : baseSlice.reducer)(
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            state[key],
                            action
                        );

                        if (config.debug) {
                            console.log(`combinedSlice\t\t ${name}`);
                            console.log(JSON.parse(JSON.stringify(response) ?? null));
                        }
                        return response;
                    }
                );
            }
        }
    });
    return { rootSlice, subSlices };
};

export { isCombinedSlice, isSliceMap };
export { buildSimpleSlice, buildSlice, combineBuildSlices };
