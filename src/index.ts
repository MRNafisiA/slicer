export { isCombinedSlice, isSliceMap } from './buildSlice';
export { buildSimpleSlice, buildSlice, combineBuildSlices } from './buildSlice';

export { buildSliceMap } from './buildSliceMap';

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
} from './types';
