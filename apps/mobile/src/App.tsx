// Main Application Entry Point
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
};

export default App;
