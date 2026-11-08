import React, { useCallback, useEffect, useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
    name: string;
    bestWpm: number;
    bestAccuracy: number;
    racesPlayed: number;
    raceWins: number;
}

const API_URL =
    import.meta.env.VITE_SERVER_URL ||
    (window.location.hostname !== 'localhost'
        ? window.location.origin
        : 'http://localhost:3001');

const LeaderboardScreen: React.FC = () => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadLeaderboard = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/leaderboard`);

            if (!response.ok) {
                throw new Error('Unable to load leaderboard.');
            }

            const data: unknown = await response.json();

            if (!Array.isArray(data)) {
                throw new Error('Invalid leaderboard response.');
            }

            setEntries(data as LeaderboardEntry[]);
        } catch {
            setError('Could not connect to the leaderboard. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadLeaderboard();
    }, [loadLeaderboard]);

    const cardStyle: React.CSSProperties = {
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
    };

    return (
        <section
            style={{
                maxWidth: '1040px',
                margin: '0 auto',
                padding: '2rem',
                color: 'var(--text-primary)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                }}
            >
                <div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            marginBottom: '0.4rem',
                        }}
                    >
                        <Trophy size={26} color="var(--accent-primary)" />
                        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
                            Leaderboard
                        </h1>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        The fastest typists rise to the top.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void loadLeaderboard()}
                    disabled={loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div style={cardStyle}>Loading leaderboard...</div>
            ) : error ? (
                <div style={cardStyle} role="alert">
                    <p>{error}</p>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void loadLeaderboard()}
                    >
                        Try again
                    </button>
                </div>
            ) : entries.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem 1rem' }}>
                    <Trophy
                        size={40}
                        color="var(--text-secondary)"
                        style={{ marginBottom: '1rem' }}
                    />
                    <h2 style={{ marginTop: 0 }}>No race records yet</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Complete a multiplayer race to appear on the leaderboard.
                    </p>
                </div>
            ) : (
                <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            textAlign: 'left',
                            minWidth: '560px',
                        }}
                    >
                        <thead>
                            <tr style={{ background: 'var(--bg-page)' }}>
                                {['Rank', 'Player', 'Best WPM', 'Best Accuracy', 'Wins'].map(
                                    (heading) => (
                                        <th
                                            key={heading}
                                            scope="col"
                                            style={{
                                                padding: '1rem',
                                                borderBottom: '1px solid var(--border-subtle)',
                                                fontSize: '0.8rem',
                                                color: 'var(--text-secondary)',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {heading}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {entries.map((entry, index) => (
                                <tr key={`${entry.name}-${index}`}>
                                    <td
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                    </td>

                                    <td
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {entry.name}
                                    </td>

                                    <td
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--border-subtle)',
                                        }}
                                    >
                                        {Math.round(entry.bestWpm)}
                                    </td>

                                    <td
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--border-subtle)',
                                        }}
                                    >
                                        {entry.bestAccuracy.toFixed(1)}%
                                    </td>

                                    <td
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--border-subtle)',
                                        }}
                                    >
                                        {entry.raceWins}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !error && entries.length > 0 && (
                <p
                    style={{
                        marginTop: '1rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                    }}
                >
                    Showing the top {entries.length} players, ranked by race wins,
                    then best WPM, then accuracy.
                </p>
            )}
        </section>
    );
};

export default LeaderboardScreen;