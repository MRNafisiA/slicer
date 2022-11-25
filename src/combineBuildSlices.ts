import { createSlice, Slice } from '@reduxjs/toolkit';

type CombinedSlice<
    State extends Record<string, unknown> = Record<string, unknown>
> = {
    rootSlice: Slice<State>;
    subSlices: Slice | CombinedSlice;
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

const isCombinedSlice = (
    sliceOrCombinedSlice: Slice | CombinedSlice
): sliceOrCombinedSlice is CombinedSlice =>
    (sliceOrCombinedSlice as CombinedSlice).rootSlice !== undefined;

const combineBuildSlices = <
    BuildSlices extends {
        [key: string]: (name: string) => Slice | CombinedSlice;
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
            Object.entries(subSlices).map(([key, slice]) => [
                key,
                (isCombinedSlice(slice)
                    ? slice.rootSlice
                    : slice
                ).getInitialState()
            ])
        ) as AggregateBuildSlices<BuildSlices>,
        reducers: {},
        extraReducers: builder => {
            for (const key in subSlices) {
                builder.addMatcher(
                    ({ type }) => type.startsWith(`${name}/${key}`),
                    (state, action) => {
                        const slice = subSlices[key];
                        (isCombinedSlice(slice)
                            ? slice.rootSlice.reducer
                            : slice.reducer)(
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            state[key],
                            action
                        );
                    }
                );
            }
        }
    });
    return { rootSlice, subSlices };
};

export type { CombinedSlice, AggregateBuildSlices };
export { isCombinedSlice, combineBuildSlices };
