export { isCombinedSlice } from './buildSlice';
export { buildSimpleSlice, buildSlice, combineBuildSlices } from './buildSlice';

export { buildSliceMap, buildCombinedSliceMap } from './buildSliceMap';

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
} from './types';
