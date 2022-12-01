import { CaseReducer, Dispatch, PayloadAction, Slice } from '@reduxjs/toolkit';

type CaseReducerFromState<State extends Record<string, unknown>> = {
    [key in keyof State]: CaseReducer<State, PayloadAction<State[key]>>;
};
type CombinedSlice<State extends Record<string, unknown> = any> = {
    rootSlice: Slice<State>;
    subSlices: { [key: string]: Slice | CombinedSlice };
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
type CombinedVariableMaterials<CS extends CombinedSlice> = {
    slices: CS;
    selector: (state: any) => CS extends CombinedSlice<infer U> ? U : never;
    dispatch: Dispatch;
};
type SliceMapState<State extends Record<string, unknown>> = {
    map: Record<string, State>;
    order: string[];
};
type GetStateFromSlice<A extends Slice> = A extends Slice<infer U> ? U : never;
type GetStateFromCombinedSlice<A extends CombinedSlice> =
    A extends CombinedSlice<infer U> ? U : never;
type GetStateFromSliceOrCombinedSlice<A extends Slice | CombinedSlice> =
    A extends Slice<infer U> ? U : A extends CombinedSlice<infer U> ? U : never;

export type {
    CaseReducerFromState,
    CombinedSlice,
    AggregateBuildSlices,
    VariableMaterials,
    CombinedVariableMaterials,
    SliceMapState,
    GetStateFromSlice,
    GetStateFromCombinedSlice,
    GetStateFromSliceOrCombinedSlice
};
