'use client';
import { useState } from 'react';

export default function SearchBar({ onSearch }: { onSearch: (flight: string) => void }) {
  const [flightNumber, setFlightNumber] = useState('');

  return (
    <div className="flex gap-4">
      <input
        className="border px-4 py-2 rounded-md"
        placeholder="Enter flight number (e.g., AI202)"
        value={flightNumber}
        onChange={(e) => setFlightNumber(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-md"
        onClick={() => onSearch(flightNumber)}
      >
        Track Flight
      </button>
    </div>
  );
}
