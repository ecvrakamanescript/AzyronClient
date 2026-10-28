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
  id: PageId;
  /** Fixed English text for now; becomes a translation key in step 1.4. */
  label: string;
  icon: ComponentType<IconProps>;
  /** 'top' entries sit at the top of the sidebar, 'bottom' entries at its lower end. */
  group: 'top' | 'bottom';
}

// Single source for sidebar and content area.
export const pages: readonly PageEntry[] = [
  { id: 'home', label: 'Home', icon: HomeIcon, group: 'top' },
  { id: 'instances', label: 'Instances', icon: InstancesIcon, group: 'top' },
  { id: 'servers', label: 'Servers', icon: ServersIcon, group: 'top' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, group: 'bottom' },
  { id: 'about', label: 'About', icon: AboutIcon, group: 'bottom' }
];
