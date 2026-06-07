import { MetadataTarget } from './MetadataTarget';
import { PropertyKey } from './PropertyKey';
import { MetadataKey } from './MetadataKey';

export type MetadataStore = WeakMap<MetadataTarget, Map<PropertyKey, Map<MetadataKey, unknown>>>;
