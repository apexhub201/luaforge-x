import React, { useState, useCallback, useEffect } from 'react';
import { Obfuscator } from './pages/Obfuscator';
import { Header } from './components/Header';

function App() {
  return (
    <div className="min-h-screen bg-dark">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Obfuscator />
      </main>
    </div>
  );
}

export default App;
