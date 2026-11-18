import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './app/AppProviders'
import { useAuthStore } from './app/authStore'
import { queryClient } from './app/queryClient'
import { router } from './router'
import './index.css'

useAuthStore.subscribe((state, previousState) => {
  if (previousState.token && !state.token) {
    queryClient.clear()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
