import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import App from './components/pages/App.tsx'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './App.css'
import './index.css'
import { nanoid } from 'nanoid'
// import { Chat } from './components/chat.tsx'
import { Chat } from './components/App.tsx'

// const id = nanoid()
// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <Chat id={id} />
//   </StrictMode>,
// )
const id = nanoid() 
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Chat id={id}/>
    </BrowserRouter>
  </React.StrictMode>,
);

// export default function IndexPage() {
//   const id = nanoid()
//   return <Chat id={id} />
// }