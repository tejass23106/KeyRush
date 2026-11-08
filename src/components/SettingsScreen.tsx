import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Palette, RotateCcw, Sun, Moon, Monitor, UserRound } from 'lucide-react';
import { CAR_COLORS } from '../types/game';

interface SettingsScreenProps {
    displayName: string;
    progressionLevel: number;
    onNavigateHome: () => void;
    onNavigateProfile: () => void;
    onStartPractice: () => void;
}
const STORAGE_KEY = 'keyrush:settings:v1';

const COLOR_OPTIONS = [
    { value: CAR_COLORS[0], name: 'Terracotta' },
    { value: CAR_COLORS[1], name: 'Sage Green' },
    { value: CAR_COLORS[2], name: 'Steel Blue' },
    { value: CAR_COLORS[3], name: 'Warm Bronze' },
];
const handleResetAllLocalData = () => {
    const confirmed = window.confirm(
        'Reset all KeyRush local data?\n\n' +
        'This will permanently delete:\n' +
        '• Player profile\n' +
        '• XP and progression\n' +
        '• Solo race history\n' +
        '• Theme and car preferences\n\n' +
        'Multiplayer statistics and leaderboard data will not be affected.\n\n' +
        'This action cannot be undone.'
    );

    if (!confirmed) return;

    const keys = [
        'keyrush:profile:v1',
        'keyrush:progression:v1',
        'keyrush:solo:history:v1',
        'keyrush:settings:v1',
    ];

    keys.forEach((key) => localStorage.removeItem(key));

    window.location.reload();
};

const DEFAULT_COLOR = CAR_COLORS[0];
type ThemeOption = 'light' | 'dark' | 'system';

const THEME_OPTIONS: {
    value: ThemeOption;
    name: string;
    description: string;
    icon: React.ReactNode;
}[] = [
        {
            value: 'light',
            name: 'Light',
            description: 'Warm, neutral appearance.',
            icon: <Sun size={20} />,
        },
        {
            value: 'dark',
            name: 'Dark',
            description: 'Comfortable appearance for low light.',
            icon: <Moon size={20} />,
        },
        {
            value: 'system',
            name: 'System',
            description: 'Follow your device appearance.',
            icon: <Monitor size={20} />,
        },
    ];

const loadTheme = (): ThemeOption => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const settings = JSON.parse(saved);

            if (['light', 'dark', 'system'].includes(settings.theme)) {
                return settings.theme;
            }
        }
    } catch {
        // Use system theme if stored data is invalid.
    }

    return 'system';
};

const loadCarColor = (): number => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const settings = JSON.parse(saved);

            if (COLOR_OPTIONS.some((color) => color.value === settings.carColor)) {
                return settings.carColor;
            }
        }
    } catch {
        // Use default settings if stored data is invalid.
    }

    return DEFAULT_COLOR;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({
    displayName,
    progressionLevel,
    onNavigateHome,
    onNavigateProfile,
    onStartPractice,
}) => {
    const [selectedColor, setSelectedColor] = useState(loadCarColor);
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(loadTheme);
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', selectedTheme);
    }, [selectedTheme]);
    const handleClearSoloHistory = () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete all solo race history? This action cannot be undone.'
        );

        if (!confirmed) return;

        localStorage.removeItem('keyrush:solo:history:v1');

        alert('Solo race history cleared successfully.');
    };
    const handleExportSoloHistory = () => {
        try {
            const saved = localStorage.getItem('keyrush:solo:history:v1');
            const records = saved ? JSON.parse(saved) : [];

            if (!Array.isArray(records) || records.length === 0) {
                alert('No solo race history available to export.');
                return;
            }

            const columns = [
                'playedAt',
                'passageTitle',
                'elapsedTimeSeconds',
                'wpm',
                'accuracy',
                'matchedCharCount',
                'totalAttemptsCount',
                'correctAttemptsCount',
                'mistakesCount',
            ];

            const escapeCSV = (value: unknown) => {
                const text = String(value ?? '');
                return `"${text.replace(/"/g, '""')}"`;
            };

            const rows = [
                columns.join(','),
                ...records.map((record) =>
                    [
                        record.playedAt,
                        record.passageTitle,
                        record.elapsedTimeSeconds,
                        record.wpm,
                        record.accuracy,
                        record.matchedCharCount,
                        record.totalAttemptsCount,
                        record.correctAttemptsCount,
                        record.mistakesCount,
                    ]
                        .map(escapeCSV)
                        .join(',')
                ),
            ];

            const blob = new Blob(
                [rows.join('\n')],
                { type: 'text/csv;charset=utf-8;' }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `keyrush-solo-statistics-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch {
            alert('Unable to export race history.');
        }
    };

    const handleThemeChange = (theme: ThemeOption) => {
        setSelectedTheme(theme);

        const saved = localStorage.getItem(STORAGE_KEY);
        const settings = saved ? JSON.parse(saved) : {};

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...settings, theme })
        );
    };

    const handleColorChange = (color: number) => {
        setSelectedColor(color);

        const saved = localStorage.getItem(STORAGE_KEY);
        const settings = saved ? JSON.parse(saved) : {};

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...settings, carColor: color })
        );
    };

    const handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        setSelectedColor(DEFAULT_COLOR);
        setSelectedTheme('system');
    };

    const colorToHex = (color: number) =>
        `#${color.toString(16).padStart(6, '0')}`;

    const cardStyle: React.CSSProperties = {
        width: '100%',
        boxSizing: 'border-box',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-card)',
    };

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '850px',
                margin: '0 auto',
                padding: '2rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
            }}
        >
            {/* Header */}
            <div>
                <button
                    type="button"
                    onClick={onNavigateHome}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: '1.25rem',
                    }}
                >
                    <ArrowLeft size={17} />
                    Back to Home
                </button>

                <h1
                    style={{
                        margin: 0,
                        fontSize: '1.8rem',
                        fontWeight: 750,
                        color: 'var(--text-primary)',
                    }}
                >
                    Settings
                </h1>

                <p
                    style={{
                        margin: '0.5rem 0 0',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                    }}
                >
                    Customize your KeyRush experience.
                </p>
            </div>
            {/* Profile Settings */}
            <section className="settings-section">
                <div className="settings-section-header">
                    <UserRound size={20} />
                    <div>
                        <h2>Profile</h2>
                        <p>Your player identity and progression.</p>
                    </div>
                </div>

                <div className="settings-card">
                    <div>
                        <h3>{displayName}</h3>
                        <p>Level {progressionLevel} Racer</p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onNavigateProfile}
                    >
                        Edit Profile
                    </button>
                </div>
            </section>
            {/* Theme preferences */}
            <section className="surface-card" style={cardStyle}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                    }}
                >
                    <Sun size={20} color="var(--accent-primary)" />

                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            color: 'var(--text-primary)',
                        }}
                    >
                        Appearance
                    </h2>
                </div>

                <p
                    style={{
                        margin: '0 0 1.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                    }}
                >
                    Choose how KeyRush looks on your device.
                </p>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '0.85rem',
                    }}
                >
                    {THEME_OPTIONS.map((theme) => {
                        const isSelected = selectedTheme === theme.value;

                        return (
                            <button
                                key={theme.value}
                                type="button"
                                onClick={() => handleThemeChange(theme.value)}
                                aria-pressed={isSelected}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '1rem',
                                    borderRadius: '9px',
                                    border: isSelected
                                        ? '2px solid var(--accent-primary)'
                                        : '1px solid var(--border-color)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        width: '100%',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    {theme.icon}

                                    {isSelected && (
                                        <Check size={17} color="var(--accent-primary)" />
                                    )}
                                </div>

                                <strong style={{ fontSize: '0.9rem' }}>
                                    {theme.name}
                                </strong>

                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {theme.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Car appearance */}
            <section className="surface-card" style={cardStyle}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                    }}
                >
                    <Palette size={20} color="var(--accent-primary)" />

                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            color: 'var(--text-primary)',
                        }}
                    >
                        Car appearance
                    </h2>
                </div>

                <p
                    style={{
                        margin: '0 0 1.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                    }}
                >
                    Choose your preferred racing car colour.
                </p>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                        gap: '0.85rem',
                    }}
                >
                    {COLOR_OPTIONS.map((color) => {
                        const isSelected = selectedColor === color.value;

                        return (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => handleColorChange(color.value)}
                                aria-pressed={isSelected}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.9rem',
                                    borderRadius: '9px',
                                    border: isSelected
                                        ? '2px solid var(--accent-primary)'
                                        : '1px solid var(--border-color)',
                                    background: 'var(--bg-surface)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        flexShrink: 0,
                                        borderRadius: '50%',
                                        backgroundColor: colorToHex(color.value),
                                    }}
                                />

                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {color.name}
                                </span>

                                {isSelected && (
                                    <Check
                                        size={17}
                                        color="var(--accent-primary)"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div
                    style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        borderRadius: '9px',
                        background: 'var(--bg-page)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                    }}
                >
                    <div
                        style={{
                            width: '48px',
                            height: '28px',
                            borderRadius: '8px 12px 8px 12px',
                            backgroundColor: colorToHex(selectedColor),
                            border: '2px solid rgba(0,0,0,0.12)',
                        }}
                    />

                    <div>
                        <div
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: 650,
                                color: 'var(--text-primary)',
                            }}
                        >
                            Selected car colour
                        </div>

                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            {COLOR_OPTIONS.find(
                                (color) => color.value === selectedColor
                            )?.name}
                        </div>
                    </div>
                </div>
            </section>
            {/* Data Management */}
            <section className="settings-section">
                <div className="settings-section-header">
                    <RotateCcw size={20} />
                    <div>
                        <h2>Data Management</h2>
                        <p>Manage your saved race data.</p>
                    </div>
                </div>

                <div className="data-management-grid">

                    {/* Clear Solo Race History */}
                    <div className="settings-card">
                        <div>
                            <h3>Clear Solo Race History</h3>
                            <p>Delete your locally saved solo race records.</p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClearSoloHistory}
                        >
                            Clear History
                        </button>
                    </div>

                    {/* Export Solo Statistics */}
                    <div className="settings-card">
                        <div>
                            <h3>Export Solo Statistics</h3>
                            <p>Download your solo race history as a CSV file.</p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleExportSoloHistory}
                        >
                            Export CSV
                        </button>
                    </div>

                    {/* Reset All Local Data */}
                    <div className="settings-card">
                        <div>
                            <h3>Reset All Local Data</h3>
                            <p>
                                Permanently reset your profile, progression,
                                solo history and preferences.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleResetAllLocalData}
                            style={{ color: 'var(--error-text)' }}
                        >
                            Reset All Data
                        </button>
                    </div>

                </div>
            </section>

            {/* Reset settings */}
            <section className="surface-card" style={cardStyle}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                            }}
                        >
                            Reset settings
                        </h2>

                        <p
                            style={{
                                margin: '0.4rem 0 0',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Restore your default car colour.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                        }}
                    >
                        <RotateCcw size={15} />
                        Reset
                    </button>
                </div>
            </section>

            {/* Actions */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}
            >
                <button
                    type="button"
                    onClick={onStartPractice}
                    className="btn btn-primary"
                >
                    Start Race
                </button>

                <button
                    type="button"
                    onClick={onNavigateHome}
                    className="btn btn-secondary"
                >
                    Home
                </button>
            </div>
        </div>
    );
};

export default SettingsScreen;