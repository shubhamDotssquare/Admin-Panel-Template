import { RouterProvider } from 'react-router'

import { AppProviders } from '@/providers'
import { router } from '@/router'

/** Composition root: global providers wrapping the router. */
export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App
