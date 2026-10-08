import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import {
  clearSession,
  hasSession,
} from '@/lib/authSession';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const sdkClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Direct fetch with credentials — bypasses the SDK's Axios client which does
// not set withCredentials, so the HttpOnly session cookie is both sent on
// requests and received from Set-Cookie headers.
async function fetchFunction(name, body = {}) {
  const headers = { "Content-Type": "application/json", "Accept": "application/json" };
  if (appParams.token) headers["Authorization"] = `Bearer ${appParams.token}`;
  if (typeof window !== "undefined" && window.location) headers["X-Origin-URL"] = window.location.href;
  const res = await fetch(`/apps/${appParams.appId}/functions/${name}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const error = new Error(data?.error || data?.reason || data?.message || 'Request failed');
    error.status = res.status;
    error.data = data;
    error.response = { data, status: res.status };
    throw error;
  }
  return data;
}

function handleExpiredSession(error) {
  const status = Number(error?.status ?? error?.response?.status);
  if (status !== 401 || !hasSession()) return;
  clearSession();
  try {
    sessionStorage.removeItem('pathfinder-unlocked');
    sessionStorage.removeItem('pathfinder-welcomed');
    sessionStorage.removeItem('pathfinder-app-user-v2');
  } catch {}
  if (typeof window !== 'undefined') window.location.assign('/');
}

async function invokeEntity(entityName, operation, args = {}) {
  if (!hasSession()) {
    return sdkClient.entities[entityName][operation](...args.fallbackArgs);
  }
  try {
    return await fetchFunction('appData', {
      entity_name: entityName,
      operation,
      args: args.payload || {},
    });
  } catch (error) {
    handleExpiredSession(error);
    throw error;
  }
}

const entityClients = new Map();
const sessionEntities = new Proxy({}, {
  get(_target, entityName) {
    if (typeof entityName !== 'string') return undefined;
    if (!entityClients.has(entityName)) {
      entityClients.set(entityName, {
        list: (sort, limit, skip, fields) => invokeEntity(entityName, 'list', {
          fallbackArgs: [sort, limit, skip, fields],
          payload: { sort, limit, skip, fields },
        }),
        filter: (query, sort, limit, skip, fields) => invokeEntity(entityName, 'filter', {
          fallbackArgs: [query, sort, limit, skip, fields],
          payload: { query, sort, limit, skip, fields },
        }),
        get: (id) => invokeEntity(entityName, 'get', {
          fallbackArgs: [id],
          payload: { id },
        }),
        create: (data) => invokeEntity(entityName, 'create', {
          fallbackArgs: [data],
          payload: { data },
        }),
        update: (id, data) => invokeEntity(entityName, 'update', {
          fallbackArgs: [id, data],
          payload: { id, data },
        }),
        delete: (id) => invokeEntity(entityName, 'delete', {
          fallbackArgs: [id],
          payload: { id },
        }),
        subscribe: () => () => {},
      });
    }
    return entityClients.get(entityName);
  },
});

const sessionFunctions = new Proxy(sdkClient.functions, {
  get(target, property, receiver) {
    if (property !== 'invoke') return Reflect.get(target, property, receiver);
    return async (name, data = {}) => {
      try {
        return await fetchFunction(name, data);
      } catch (error) {
        handleExpiredSession(error);
        throw error;
      }
    };
  },
});

export const base44 = new Proxy(sdkClient, {
  get(target, property, receiver) {
    if (property === 'entities' && hasSession()) return sessionEntities;
    if (property === 'functions') return sessionFunctions;
    const value = Reflect.get(target, property, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});