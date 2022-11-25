import { useMemo } from 'react';
import {
    CaseReducer,
    createSlice,
    Dispatch,
    PayloadAction,
    Slice
} from '@reduxjs/toolkit';

const buildSimpleSlice = <State, Name extends string>(
    name: Name,
    initialState: State | (() => State)
) =>
    createSlice({
        name,
        initialState,
        reducers: {
            set: (_, { payload }) => payload
        }
    }) as Slice<State, { set: CaseReducer<State, PayloadAction<State>> }, Name>;

const useSimpleSliceVariable = <State>({
    slice,
    selector,
    useSelector,
    dispatch
}: {
    slice: Slice<State, { set: CaseReducer<State, PayloadAction<State>> }>;
    selector: (state: any) => State;
    useSelector: (selector: (rootState: any) => State) => State;
    dispatch: Dispatch;
}) => {
    const setter = useMemo<(value: Slice<State>['actions']['set']) => void>(
        () => value => {
            dispatch(slice.actions.set(value));
        },
        [slice, dispatch]
    );
    return {
        v: useSelector(selector),
        set: setter
    };
};

export { buildSimpleSlice, useSimpleSliceVariable };
