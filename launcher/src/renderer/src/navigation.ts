import type { ComponentType } from 'react';
import {
  AboutIcon,
  HomeIcon,
  InstancesIcon,
  ServersIcon,
  SettingsIcon,
  type IconProps
} from './components/Icons';

export type PageId = 'home' | 'instances' | 'servers' | 'settings' | 'about';

export interface PageEntry {
  /** Also selects the visible name: the translation nav.<id>. */
  id: PageId;
  icon: ComponentType<IconProps>;
  /** 'top' entries sit at the top of the sidebar, 'bottom' entries at its lower end. */
  group: 'top' | 'bottom';
}

// Single source for sidebar and content area.
export const pages: readonly PageEntry[] = [
  { id: 'home', icon: HomeIcon, group: 'top' },
  { id: 'instances', icon: InstancesIcon, group: 'top' },
  { id: 'servers', icon: ServersIcon, group: 'top' },
  { id: 'settings', icon: SettingsIcon, group: 'bottom' },
  { id: 'about', icon: AboutIcon, group: 'bottom' }
];
