import { API_BASE_URL } from '@/config/config';
import {
  warehouseOfflineStorage,
  type WarehousePendingItem,
} from '@/utils/warehouseOfflineStorage';
import { useWarehouseQueueStore } from '@/store/useWarehouseQueueStore';

const ERUDA_SCOPE = 'warehouse';
const ERUDA_STATUS_URL = `${API_BASE_URL}/api/v1/debug/eruda/status?scope=${ERUDA_SCOPE}`;
const CHECK_INTERVAL_MS = 30_000;

type ErudaController = {
  init: () => void;
  destroy?: () => void;
};

type ErudaModule = {
  default: ErudaController;
};

type ErudaStatusResponse = {
  scope: string;
  enabled: boolean;
  ttl_seconds: number | null;
};

type WarehouseDebugPhoto = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

type WarehouseDebugQueueItem = Omit<WarehousePendingItem, 'photos'> & {
  photos: WarehouseDebugPhoto[];
};

type WarehouseDebugQueueSnapshot = {
  isLoaded: boolean;
  count: number;
  items: WarehouseDebugQueueItem[];
};

type WarehouseDebugApi = {
  getQueue: () => Promise<WarehouseDebugQueueSnapshot>;
  getRawQueue: () => Promise<WarehousePendingItem[]>;
  printQueue: () => Promise<WarehouseDebugQueueSnapshot>;
  initializeQueueStore: () => Promise<WarehouseDebugQueueSnapshot>;
};

declare global {
  interface Window {
    akbWarehouseDebug?: WarehouseDebugApi;
  }
}

let erudaController: ErudaController | null = null;
let checkIntervalId: number | null = null;
let routeHooksInstalled = false;
let visibilityHookInstalled = false;
let checkInFlight: Promise<void> | null = null;

function isWarehouseRoute(): boolean {
  return window.location.pathname === '/warehouse' || window.location.pathname === '/admin/warehouse';
}

function getAdminToken(): string | null {
  return localStorage.getItem('access_token');
}

async function fetchErudaStatus(): Promise<ErudaStatusResponse> {
  const token = getAdminToken();
  if (!token) {
    return { scope: ERUDA_SCOPE, enabled: false, ttl_seconds: null };
  }

  const response = await fetch(ERUDA_STATUS_URL, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'X-Admin-Authorization': `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return { scope: ERUDA_SCOPE, enabled: false, ttl_seconds: null };
  }

  return (await response.json()) as ErudaStatusResponse;
}

function toDebugPhoto(photo: File): WarehouseDebugPhoto {
  return {
    name: photo.name,
    size: photo.size,
    type: photo.type,
    lastModified: photo.lastModified,
  };
}

function toDebugQueueItem(item: WarehousePendingItem): WarehouseDebugQueueItem {
  return {
    ...item,
    photos: item.photos.map(toDebugPhoto),
  };
}

async function buildQueueSnapshot(): Promise<WarehouseDebugQueueSnapshot> {
  const rawItems = await warehouseOfflineStorage.getAllItems();
  const state = useWarehouseQueueStore.getState();
  return {
    isLoaded: state.isLoaded,
    count: rawItems.length,
    items: rawItems.map(toDebugQueueItem),
  };
}

function installWarehouseDebugHelpers(): void {
  window.akbWarehouseDebug = {
    getQueue: buildQueueSnapshot,
    getRawQueue: () => warehouseOfflineStorage.getAllItems(),
    async printQueue() {
      const snapshot = await buildQueueSnapshot();
      console.table(
        snapshot.items.map((item) => ({
          id: item.id,
          transactionIds: item.transactionIds.join(','),
          clientCode: item.clientCode,
          flightName: item.flightName,
          deliveryMethod: item.deliveryMethod,
          status: item.status,
          error: item.error ?? '',
          photoCount: item.photos.length,
          timestamp: new Date(item.timestamp).toISOString(),
        })),
      );
      return snapshot;
    },
    async initializeQueueStore() {
      await useWarehouseQueueStore.getState().initialize();
      return buildQueueSnapshot();
    },
  };
}

function removeWarehouseDebugHelpers(): void {
  delete window.akbWarehouseDebug;
}

async function enableEruda(): Promise<void> {
  if (erudaController) {
    installWarehouseDebugHelpers();
    return;
  }

  const erudaModule = (await import('eruda')) as ErudaModule;
  erudaModule.default.init();
  erudaController = erudaModule.default;
  installWarehouseDebugHelpers();
  console.info('AKB Eruda enabled for warehouse debugging.');
}

function disableEruda(): void {
  if (erudaController?.destroy) {
    erudaController.destroy();
  }
  erudaController = null;
  removeWarehouseDebugHelpers();
}

async function checkAndApplyErudaStatus(): Promise<void> {
  if (checkInFlight) return checkInFlight;

  checkInFlight = (async () => {
    try {
      if (!isWarehouseRoute()) {
        disableEruda();
        return;
      }

      const status = await fetchErudaStatus();
      if (status.enabled) {
        await enableEruda();
      } else {
        disableEruda();
      }
    } catch (error) {
      console.warn('AKB Eruda status check failed.', error);
    } finally {
      checkInFlight = null;
    }
  })();

  return checkInFlight;
}

function installRouteHooks(): void {
  if (routeHooksInstalled) return;
  routeHooksInstalled = true;

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
    originalPushState(data, unused, url);
    window.setTimeout(() => void checkAndApplyErudaStatus(), 0);
  }) as typeof window.history.pushState;

  window.history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
    originalReplaceState(data, unused, url);
    window.setTimeout(() => void checkAndApplyErudaStatus(), 0);
  }) as typeof window.history.replaceState;

  window.addEventListener('popstate', () => void checkAndApplyErudaStatus());
}

function installVisibilityHook(): void {
  if (visibilityHookInstalled) return;
  visibilityHookInstalled = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void checkAndApplyErudaStatus();
    }
  });
}

export function initializeErudaControl(): void {
  installRouteHooks();
  installVisibilityHook();
  void checkAndApplyErudaStatus();

  if (checkIntervalId === null) {
    checkIntervalId = window.setInterval(() => {
      void checkAndApplyErudaStatus();
    }, CHECK_INTERVAL_MS);
  }
}
