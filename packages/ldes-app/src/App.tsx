import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LDESContainer } from './pages/LDES/LDESContainer';
import { ServiceDetailContainer } from './pages/Services/ServiceDetailContainer';
import { ServicesContainer } from './pages/Services/ServicesContainer';

export function App() {
  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full">
        <Header />
        <Navigation />
      </div>
      <div className="w-full max-w-6xl px-6 mt-16">
        <Switch>
          <Route path="/services" exact>
            <ServicesContainer />
          </Route>
          <Route path="/services/:id">
            <ServiceDetailContainer />
          </Route>
          <Route path="/ldes">
            <LDESContainer />
          </Route>
          <Redirect to="/services" />
        </Switch>
      </div>
    </div>
  );
}
