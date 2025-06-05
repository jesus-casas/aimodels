import React from 'react';

export const FolderIcon = ({ style = {}, className = '', onClick }) => (
  <svg 
    width="25" 
    height="25" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={style}
    className={className}
    onClick={onClick}
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export const EditIcon = ({ style = {}, className = '', onClick }) => (
  <svg 
    width="25" 
    height="25" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={style}
    className={className}
    onClick={onClick}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const SidebarIcon = ({ style = {}, className = '', onClick }) => (
  <svg 
    width="25" 
    height="25" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={style}
    className={className}
    onClick={onClick}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

export const InterfaceIcon = ({ style = {}, className = '', onClick }) => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={style}
    className={className}
    onClick={onClick}
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const ArrowDownIcon = ({ style = {}, className = '', onClick }) => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 330 330" 
    fill="currentColor" 
    style={style}
    className={className}
    onClick={onClick}
  >
    <path d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393
      c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393
      s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"/>
  </svg>
);

export const DeleteIcon = ({ style = {}, className = '', onClick }) => (
  <svg
    id="Layer_3"
    height="512"
    viewBox="0 0 32 32"
    width="512"
    xmlns="http://www.w3.org/2000/svg"
    data-name="Layer 3"
    style={{ width: 16, height: 16, ...style }}
    className={className}
    onClick={onClick}
  >
    <path d="m17.414 16 6.293-6.293a1 1 0 0 0 -1.414-1.414l-6.293 6.293-6.293-6.293a1 1 0 0 0 -1.414 1.414l6.293 6.293-6.293 6.293a1 1 0 1 0 1.414 1.414l6.293-6.293 6.293 6.293a1 1 0 0 0 1.414-1.414z" />
  </svg>
);

export const ChatIcon = ({ style = {}, className = '', onClick }) => (
  <svg 
    width="25" 
    height="25" 
    viewBox="0 0 64 64" 
    xmlns="http://www.w3.org/2000/svg" 
    data-name="Layer 1"
    style={style}
    className={className}
    onClick={onClick}
  >
    <path d="m3.06 4.49c-.39-.02-.75.18-.94.52-.18.34-.16.76.07 1.07.14.19 13.6 19.18 8.02 52.26-.04.29.04.59.23.81.19.23.47.36.76.36h49.77c.53 0 .97-.41 1-.94.03-.51.7-12.73-6.22-25.61-6.38-11.88-20.7-26.47-52.69-28.47zm26.27 11.46c-.16.38-.53.61-.92.61-.13 0-.26-.02-.39-.07-1.27-.54-2.06-.79-2.07-.8-.52-.17-.81-.73-.64-1.25.16-.53.73-.82 1.25-.65.04.01.87.28 2.23.85.51.22.75.8.54 1.31zm23.81 31.01h-.08c-.52 0-.95-.4-.99-.92-.98-12.98-9.56-21.09-16.58-25.61-.47-.3-.6-.92-.3-1.38.29-.47.92-.6 1.38-.3 7.41 4.76 16.45 13.34 17.49 27.14.04.55-.37 1.03-.92 1.07z"/>
  </svg>
); 