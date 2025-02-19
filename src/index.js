import React from 'react';
import { render } from 'react-dom';
import "./index.css"
import Layout from './component/Layout';
import { PrimeReactProvider } from 'primereact/api';

const App = () => {
  return (
    <PrimeReactProvider>
      <div className='container'>
        {/* <span className='hi'>{authUser}</span>
        <h1 className='!text-red-500'>Hiii</h1> */}
        <Layout />
      </div>
    </PrimeReactProvider>
  );
};

const rootElement = document.getElementById('react-page-template');
render(<App />, rootElement);
