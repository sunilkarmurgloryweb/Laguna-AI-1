import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import HotelHomepage from './components/HotelHomepage';

function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50">
        <HotelHomepage />
      </div>
    </Provider>
  );
}

export default App;