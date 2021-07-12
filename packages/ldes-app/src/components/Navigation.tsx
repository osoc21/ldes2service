import React from 'react';
import { NavLink } from 'react-router-dom';

export function Navigation() {
  return (
    <nav className="bg-gray-50 border-t border-b py-3 flex justify-center">
      <div className="w-full max-w-6xl px-6">
        <ul className="flex gap-8">
          <li>
            <NavLink to="/services" activeClassName="underline">
              Services
            </NavLink>
          </li>
          <li>
            <NavLink to="/ldes" activeClassName="underline">
              LDES
            </NavLink>
          </li>
          <li>
            <a href="https://github.com/osoc21/ldes2service" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
