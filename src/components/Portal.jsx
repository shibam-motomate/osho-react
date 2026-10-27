import { createPortal } from 'react-dom';

/* Renders bottom sheets (and their dimmed backdrop) straight into <body>. Inside a screen they sat
   in its scrolling layer, and iPhone Safari then drew the tab bar on top of the sheet's last rows
   whatever their z-index. From <body> they stack above the tab bar as intended. */
export const Portal = ({children}) => (typeof document === 'undefined' ? children : createPortal(children, document.body));
