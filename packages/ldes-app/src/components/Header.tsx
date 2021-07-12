import React from 'react';
import { Link } from 'react-router-dom';
import { Crest } from '../assets/crest';

export function Header() {
  return (
    <header className="flex items-center px-4 py-3">
      <Link to="/" className="flex">
        <div className="mr-3">
          <Crest className="w-7 h-7" />
        </div>
        <div className="font-medium text-xl hover:text-blue-500 transition-colors">Linked Out</div>
      </Link>
    </header>
  );
}
