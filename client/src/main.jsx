/*Code Attribution: */
/**************************************************************************************************************
 * Author: React Contributors
 * Date: 2026
 * Title: React and React DOM
 * Type: [Source Code]
 * Available at: <https://github.com/react/react> [Accessed 15 September 2026]
 **************************************************************************************************************/

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);
