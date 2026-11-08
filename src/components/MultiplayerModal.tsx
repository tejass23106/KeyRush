import React, { useEffect, useState } from 'react';

import { Users, PlusCircle, LogIn, X, AlertCircle } from 'lucide-react';

import { socketService } from '../services/socketService';
import { Room } from '../types/game';

import {
  loadDisplayName,
  normalizeDisplayName,
} from '../utils/playerProfile';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinedRoom: (room: Room, playerId: string) => void;
  initialRoomCode?: string;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  onJoinedRoom,
  initialRoomCode = '',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [name, setName] = useState<string>(() => loadDisplayName());
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setName(loadDisplayName());
      setError('');
      setLoading(false);

      if (initialRoomCode) {
        setRoomCode(initialRoomCode.toUpperCase());
        setActiveTab('join');
      } else {
        setRoomCode('');
        setActiveTab('create');
      }
    }
  }, [isOpen, initialRoomCode]);
  if (!isOpen) return null;

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = normalizeDisplayName(name);

    if (!displayName) {
      setError('Please enter your display name.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await socketService.createRoom(displayName);
      if (res.ok && res.room && res.playerId) {
        // Direct transition using authoritative room returned from backend
        onJoinedRoom(res.room, res.playerId);
      } else {
        setError(res.error || 'Could not create room.');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = normalizeDisplayName(name);

    if (!displayName) {
      setError('Please enter your display name.');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a 6-character room code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await socketService.joinRoom(roomCode, displayName);
      if (res.ok && res.room && res.playerId) {
        onJoinedRoom(res.room, res.playerId);
      } else {
        setError(res.error || 'Invalid or full room code.');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(36, 38, 33, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        caretColor: 'var(--text-primary)',
        zIndex: 100,
        padding: '1.5rem',
      }}
    >
      <div
        className="surface-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          color: 'var(--text-primary)',
          caretColor: 'var(--text-primary)',
          padding: '2rem',
          position: 'relative',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            color: 'var(--text-primary)',
            caretColor: 'var(--text-primary)',
            top: '1.25rem',
            right: '1.25rem',

          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              color: 'var(--text-primary)',
              caretColor: 'var(--text-primary)',
              alignItems: 'center',
              justifyContent: 'center',

            }}
          >
            <Users size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Play with Friends
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Create a private lobby or enter an invite code.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            padding: '0.25rem',
            backgroundColor: 'var(--bg-page)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            caretColor: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            onClick={() => {
              setActiveTab('create');
              setError('');
            }}
            style={{
              padding: '0.6rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'create' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'create' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: activeTab === 'create' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              display: 'flex',

              caretColor: 'var(--text-primary)',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <PlusCircle size={16} />
            Create Room
          </button>

          <button
            onClick={() => {
              setActiveTab('join');
              setError('');
            }}
            style={{
              padding: '0.6rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'join' ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === 'join' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: activeTab === 'join' ? '1px solid var(--border-subtle)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',

              caretColor: 'var(--text-primary)',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <LogIn size={16} />
            Join Room
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              caretColor: 'var(--text-primary)',

              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Create Room Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem',
                  fontFamily: 'var(--font-mono)',

                  caretColor: 'var(--text-primary)',
                  textTransform: 'uppercase',
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ApexRacer"
                maxLength={24}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  caretColor: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-page)',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              {loading ? 'Creating Lobby...' : 'Create Private Room'}
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  caretColor: 'var(--text-primary)',

                  marginBottom: '0.35rem',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                }}
              >
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. RUSH42"
                maxLength={6}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  color: 'var(--text-primary)',
                  caretColor: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-page)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,

                  color: 'var(--text-primary)',
                  caretColor: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SpeedDemon"
                maxLength={24}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  caretColor: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-page)',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              {loading ? 'Joining Lobby...' : 'Join Room'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
