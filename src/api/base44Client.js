import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { getPathfinderSessionToken } from '@/lib/authSession';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const sdkClient = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

async function invokeEntity(entityName, operation, args = {}) {
  const sessionToken = getPathfinderSessionToken();
  if (!sessionToken) {
    return sdkClient.entities[entityName][operation](...args.fallbackArgs);
  }
  const response = await sdkClient.functions.invoke('appData', {
    session_token: sessionToken,
    entity_name: entityName,
    operation,
    args: args.payload || {},
  });
  return response?.data ?? response;
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
    return (name, data = {}) => {
      const sessionToken = getPathfinderSessionToken();
      const payload = sessionToken && data && typeof data === 'object' && !Array.isArray(data)
        ? { ...data, pathfinder_session_token: sessionToken }
        : data;
      return target.invoke(name, payload);
    };
  },
});

export const base44 = new Proxy(sdkClient, {
  get(target, property, receiver) {
    if (property === 'entities' && getPathfinderSessionToken()) return sessionEntities;
    if (property === 'functions') return sessionFunctions;
    const value = Reflect.get(target, property, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});
