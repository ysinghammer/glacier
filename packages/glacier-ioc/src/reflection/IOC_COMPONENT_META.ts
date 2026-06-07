import { Reflection } from '@glacier/reflection';

import type { ComponentMeta } from '../interfaces/ComponentMeta';

export const IOC_COMPONENT_META = new Reflection<ComponentMeta>('ioc:component:meta');
