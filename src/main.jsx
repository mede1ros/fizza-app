import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { db } from '@/api/db'
import UpdatePrompt from '@/components/UpdatePrompt'
import '@/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>
)

db.init()
  .then(() => root.render(<><App /><UpdatePrompt /></>))
  .catch((error) => {
    console.error(error)
    root.render(
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-sm">
        Não foi possível abrir os dados do Fizza neste navegador. Feche e abra o app novamente.
      </div>
    )
  })
