import type { AzyronApi } from '../../shared/api';

declare global {
  interface Window {
    readonly azyron: AzyronApi;
  }
}
