'use client';

import { useState } from 'react';

interface UserInfoFormProps {
  onSubmit: (name: string, email: string, address: string) => void;
  isLoading?: boolean;
}

export function UserInfoForm({ onSubmit, isLoading }: UserInfoFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim() && address.trim()) {
      onSubmit(name.trim(), email.trim(), address.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-zinc-700"
        >
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-zinc-700"
        >
          Address
        </label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          disabled={isLoading}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          placeholder="123 Main St, City, State 12345"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !name.trim() || !email.trim() || !address.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? 'Creating Document...' : 'Continue to Sign'}
      </button>
    </form>
  );
}
