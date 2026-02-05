'use client';

import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="user-card">
      <div className="user-card__header">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.name}
            className="user-card__avatar"
          />
        )}
        <div className="user-card__info">
          <h2 className="user-card__name">{user.name}</h2>
          <p className="user-card__email">{user.email}</p>
        </div>
      </div>
      <div className="user-card__body">
        <p className="user-card__id">ID: {user.id}</p>
      </div>
    </div>
  );
};
