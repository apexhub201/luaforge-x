import React from 'react';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#07090d', 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        LUAUFORGE X
      </h1>
      <p style={{ color: '#888' }}>
        Advanced Lua/Luau Virtualization Engine
      </p>
      <p style={{ color: '#00d4ff', marginTop: '2rem' }}>
        System Ready
      </p>
    </div>
  );
}

export default App;
