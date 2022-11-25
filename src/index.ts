export { buildSimpleSlice, useSimpleSliceVariable } from './buildSimpleSlice';

export type {
    ActionCreatorFromState,
    CaseReducerFromState,
    VariableMaterials
} from './buildSlice';
export { buildSlice, getSliceSetters, useSliceVariables } from './buildSlice';

export type { CombinedSlice, AggregateBuildSlices } from './combineBuildSlices';
export { isCombinedSlice, combineBuildSlices } from './combineBuildSlices';
