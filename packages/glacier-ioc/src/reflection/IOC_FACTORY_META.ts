import { Reflection } from '@glacier/reflection';

import type { ComponentMeta } from '../interfaces/ComponentMeta';

export const IOC_FACTORY_META = new Reflection<ComponentMeta>('ioc:factory:meta');
