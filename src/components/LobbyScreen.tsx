import React, { useState } from 'react';
import { Room, Player } from '../types/game';
import { socketService } from '../services/socketService';
import { Copy, Check, Play, LogOut, Shield, User, AlertCircle } from 'lucide-react';

interface LobbyScreenProps {
  room: Room;
  currentPlayerId: string;
  onLeaveLobby: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  currentPlayerId,
  onLeaveLobby,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const currentPlayer = room.players.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;

  const connectedPlayers = room.players.filter((p) => p.isConnected);
  const canStartRace =
    isHost &&
    connectedPlayers.length >= 2 &&
    connectedPlayers.every((p) => p.isReady || p.isHost);

  const inviteUrl = `${window.location.origin}/?room=${room.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    socketService.toggleReady();
  };

  const handleStartRace = () => {
    if (!canStartRace) {
      if (connectedPlayers.length < 2) {
        setError('Need at least 2 players to start a multiplayer race.');
      } else {
        setError('All players must click Ready before starting.');
      }
      return;
    }
    setError('');
    socketService.startRace();
  };

  const handleLeave = () => {
    socketService.leaveRoom();
    onLeaveLobby();
  };

  return (
    <div className="lobby-container">
      {/* Header Info Banner */}
      <div className="surface-card lobby-header">
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.25rem',
            }}
          >
            Multiplayer Room Code
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.5rem',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              letterSpacing: '0.1em',
              lineHeight: 1,
            }}
          >
            {room.code}
          </div>
        </div>

        {/* Invitation Link */}
        <div className="lobby-header-actions">
          <button
            onClick={handleCopyLink}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
          >
            {copied ? <Check size={16} color="var(--accent-secondary)" /> : <Copy size={16} />}
            {copied ? 'Link Copied!' : 'Copy Invite Link'}
          </button>

          <button
            onClick={handleLeave}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.875rem', color: 'var(--error-text)' }}
          >
            <LogOut size={16} />
            Leave
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error-text)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Players List Grid (2 to 4 slots) */}
      <div
        className="surface-card"
        style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Lobby Participants ({room.players.length} / {room.maxPlayers})
          </h3>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Minimum 2 players to start
          </span>
        </div>
        <div className="lobby-player-grid">
          {Array.from({ length: room.maxPlayers }).map((_, slotIdx) => {
            const player = room.players[slotIdx];

            if (player) {
              return (
                <div
                  key={player.id}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-page)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: 0,
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: '1 1 140px' }}>
                    {/* Car Color Badge */}
                    <div
                      style={{
                        width: '24px',
                        height: '14px',
                        backgroundColor: `#${player.colorHex.toString(16).padStart(6, '0')}`,
                        borderRadius: '3px',
                        border: '1px solid #FCFBF8',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '180px',
                          }}
                        >
                          {player.name}
                        </span>
                        {player.id === currentPlayerId && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.35rem',
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '2px',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {player.isHost ? 'Room Host' : 'Participant'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {player.isHost ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.3rem 0.6rem',
                          backgroundColor: 'rgba(166, 71, 45, 0.1)',
                          color: 'var(--accent-primary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <Shield size={12} />
                        HOST
                      </span>
                    ) : player.isReady ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.3rem 0.6rem',
                          backgroundColor: 'rgba(101, 113, 85, 0.15)',
                          color: 'var(--accent-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <Check size={12} />
                        READY
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '0.3rem 0.6rem',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        NOT READY
                      </span>
                    )}
                  </div>
                </div>
              );
            } else {
              return (
                <div
                  key={`empty-${slotIdx}`}
                  style={{
                    padding: '1.25rem',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <User size={16} style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                  Empty Slot 0{slotIdx + 1}
                </div>
              );
            }
          })}
        </div>

        {/* Action Bar */}
        <div className="lobby-action-bar">
          <div>
            {!isHost && (
              <button
                onClick={handleToggleReady}
                className={currentPlayer?.isReady ? 'btn btn-secondary' : 'btn btn-primary'}
                style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}
              >
                {currentPlayer?.isReady ? 'Cancel Ready' : 'I Am Ready'}
              </button>
            )}
          </div>

          <div>
            {isHost && (
              <button
                onClick={handleStartRace}
                disabled={!canStartRace}
                className="btn btn-primary"
                style={{
                  padding: '0.85rem 2.5rem',
                  fontSize: '1rem',
                  opacity: canStartRace ? 1 : 0.5,
                  cursor: canStartRace ? 'pointer' : 'not-allowed',
                }}
              >
                <Play size={18} fill="currentColor" />
                Start Race
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
