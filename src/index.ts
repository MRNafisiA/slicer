import { useMemo } from 'react';
import {
    ActionCreatorWithPayload,
    CaseReducer,
    createSlice,
    Dispatch,
    PayloadAction,
    Slice
} from '@reduxjs/toolkit';

type ActionCreatorFromState<State extends Record<string, unknown>> = {
    [key in keyof State]: ActionCreatorWithPayload<State[key]>;
};

////////////////////

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

const useSimpleSliceVariable = <State>(
    slice: Slice<State, { set: CaseReducer<State, PayloadAction<State>> }>,
    selector: (state: any) => State,
    {
        useSelector,
        dispatch
    }: {
        useSelector: (selector: (rootState: any) => State) => State;
        dispatch: Dispatch;
    }
) => {
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

////////////////////

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
    }) as Slice<
        State,
        {
            [key in keyof State]: CaseReducer<State, PayloadAction<State[key]>>;
        },
        Name
    >;

const getSliceSetters = <State extends Record<string, unknown>>(
    actions: ActionCreatorFromState<State>,
    dispatch: Dispatch
): {
    [key in keyof Slice<State>['actions']]: (
        value: Slice<State>['actions'][key]
    ) => void;
} =>
    Object.fromEntries(
        Object.entries(actions).map(([key, action]) => [
            key as unknown,
            value => {
                dispatch(action(value));
            }
        ])
    );

const useSliceVariables = <State extends Record<string, unknown>>(
    actions: ActionCreatorFromState<State>,
    selector: (state: any) => State,
    {
        useAppSelector,
        dispatch
    }: {
        useAppSelector: (selector: (rootState: any) => State) => State;
        dispatch: Dispatch;
    }
): {
    [key in keyof State]: { v: State[key]; set: (v: State[key]) => void };
} => {
    const state = useAppSelector(selector);
    const setters = useMemo(
        () => getSliceSetters(actions, dispatch),
        [actions, dispatch]
    );
    return Object.fromEntries(
        Object.entries(setters).map(([key, setter]) => [
            key,
            { v: state[key], set: setter }
        ])
    ) as any;
};

export { buildSimpleSlice, useSimpleSliceVariable };
export { buildSlice, useSliceVariables };
export { getSliceSetters };
