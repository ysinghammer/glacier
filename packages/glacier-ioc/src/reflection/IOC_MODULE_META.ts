import { Reflection } from '@glacier/reflection';

import type { ModuleMeta } from '../interfaces/ModuleMeta';

export const IOC_MODULE_META = new Reflection<ModuleMeta>('ioc:module:meta');
