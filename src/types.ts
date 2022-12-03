import { CaseReducer, Dispatch, PayloadAction, Slice } from '@reduxjs/toolkit';

type CaseReducerFromState<State extends Record<string, unknown>> = {
    [key in keyof State]: CaseReducer<State, PayloadAction<State[key]>>;
};
type CombinedSlice<State extends Record<string, unknown> = any> = {
    rootSlice: Slice<State>;
    subSlices: { [key: string]: Slice | CombinedSlice };
};
type SliceMap<State extends Record<string, unknown> = any> = {
    slice: Slice<SliceMapState<State>>;
    getVariableMaterials: (
        dispatch: Dispatch,
        selector: (state: any) => SliceMapState<State>,
        id: string
    ) => {
        selector: (state: any) => State;
        dispatch: Dispatch;
    } & (
        | {
              actions: Slice['actions'];
          }
        | {
              slices: CombinedSlice;
          }
        | {
              sliceMap: SliceMap;
          }
    );
};
type AggregateBuildSlices<
    BuildSlices extends {
        [key: string]: (name: string) => Slice | CombinedSlice;
    }
> = {
    [key in keyof BuildSlices]: ReturnType<BuildSlices[key]> extends Slice<
        infer U
    >
        ? U
        : ReturnType<BuildSlices[key]> extends CombinedSlice<infer U>
        ? U
        : never;
};
type VariableMaterials<S extends Slice> = {
    actions: S['actions'];
    selector: (state: any) => GetStateFromSlice<S>;
    dispatch: Dispatch;
};
type CombinedVariableMaterials<S extends CombinedSlice> = {
    slices: S;
    selector: (state: any) => GetStateFromCombinedSlice<S>;
    dispatch: Dispatch;
};
type MapVariableMaterials<S extends SliceMap> = {
    sliceMap: S;
    selector: (state: any) => GetStateFromSliceMap<S>;
    dispatch: Dispatch;
};
type SliceMapState<State extends Record<string, unknown>> = {
    map: Record<string, State>;
    order: string[];
};
type GetStateFromSlice<A extends Slice> = A extends Slice<infer U> ? U : never;
type GetStateFromCombinedSlice<A extends CombinedSlice> =
    A extends CombinedSlice<infer U> ? U : never;
type GetStateFromSliceMap<A extends SliceMap> = A extends SliceMap<infer U>
    ? SliceMapState<U>
    : never;
type GetStateFromSliceOrCombinedSliceOrSliceMap<
    A extends Slice | CombinedSlice | SliceMap
> = A extends Slice<infer U>
    ? U
    : A extends CombinedSlice<infer U>
    ? U
    : A extends SliceMap<infer U>
    ? SliceMapState<U>
    : never;

export type {
    CaseReducerFromState,
    CombinedSlice,
    SliceMap,
    AggregateBuildSlices,
    VariableMaterials,
    CombinedVariableMaterials,
    MapVariableMaterials,
    SliceMapState,
    GetStateFromSlice,
    GetStateFromCombinedSlice,
    GetStateFromSliceMap,
    GetStateFromSliceOrCombinedSliceOrSliceMap
};
