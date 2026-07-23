import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider, removeOldestQuery } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.js';
import './styles.css';
import './styles/global.css';
import ThemeInit from './components/ThemeInit.js';
import UiInit from './components/UiInit.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2-minute stale time — reduces redundant refetches while keeping data fresh.
      staleTime: 2 * 60_000,
      // Don't refetch just because the user switched tabs — this was flooding the
      // rate limiter. Explicit invalidation (after mutations) keeps data current.
      refetchOnWindowFocus: false,
      // One retry on failure, then surface the error.
      retry: 1,
      // Cache entries survive 24h so the localStorage persister below can
      // restore them on reload — stats paint INSTANTLY from last-known values
      // while fresh data revalidates in the background (stale-while-revalidate).
      gcTime: 24 * 60 * 60_000,
    },
  },
});

// Persist the query cache to localStorage: on a hard reload the app paints
// yesterday's numbers immediately instead of spinners, then refetches.
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'ihsan_rq_cache',
  throttleTime: 2_000,
  // If localStorage is full, drop the oldest queries instead of giving up.
  retry: removeOldestQuery,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        // Bump to invalidate every persisted cache after a breaking shape change.
        buster: 'v1',
      }}
    >
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <ThemeInit />
        <UiInit />
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  </React.StrictMode>
);
