import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { nanoid } from 'nanoid';

import './App.css';
import './index.css';

import { Chat } from './components/App.tsx'; 

const id = nanoid();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Chat id={id} />
    </BrowserRouter>
  </React.StrictMode>
);
