import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import HotelHomepage from './components/HotelHomepage';

function App() {
  return (
    <Provider store={store}>
      <HotelHomepage />
    </Provider>
  );
}

export default App;