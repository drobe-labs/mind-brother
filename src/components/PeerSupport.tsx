import React, { useState, useEffect } from 'react';
import {
  peerSupportService,
  type PeerSupportPreferences,
  type PeerMatch,
  type PeerConnection,
  type PeerSupportType,
  PEER_SUPPORT_TYPES,
} from '../lib/peerSupportService';
import './PeerSupport.css';

interface PeerSupportProps {
  userId: string;
  onClose?: () => void;
}

type Tab = 'discover' | 'connections' | 'settings';

export default function PeerSupport({ userId, onClose }: PeerSupportProps) {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [preferences, setPreferences] = useState<PeerSupportPreferences | null>(null);
  const [matches, setMatches] = useState<PeerMatch[]>([]);
  const [connections, setConnections] = useState<PeerConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ received: PeerConnection[]; sent: PeerConnection[] }>({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Onboarding state for first-time users
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [tempPrefs, setTempPrefs] = useState<Partial<PeerSupportPreferences>>({
    displayName: '',
    availableFor: [],
    showCulturalBackground: true,
    showCommunities: true,
    showConcerns: false,
    showAgeRange: true,
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const prefs = await peerSupportService.getPeerSupportPreferences(userId);
      setPreferences(prefs);

      if (!prefs || !prefs.optedIn) {
        setShowOnboarding(true);
      } else {
        // Load matches and connections
        const [matchData, connectionData, pendingData] = await Promise.all([
          peerSupportService.suggestPeerSupport(userId),
          peerSupportService.getUserConnections(userId, 'accepted'),
          peerSupportService.getPendingRequests(userId),
        ]);
        setMatches(matchData);
        setConnections(connectionData);
        setPendingRequests(pendingData);
      }
    } catch (error) {
      console.error('Error loading peer support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptIn = async () => {
    if (!tempPrefs.displayName?.trim()) {
      setMessage({ type: 'error', text: 'Please enter a display name' });
      return;
    }
    if (!tempPrefs.availableFor?.length) {
      setMessage({ type: 'error', text: 'Please select at least one support type' });
      return;
    }

    setSaving(true);
    const success = await peerSupportService.optIntoPeerSupport(
      userId,
      tempPrefs.displayName,
      tempPrefs.availableFor as PeerSupportType[],
      {
        showCulturalBackground: tempPrefs.showCulturalBackground,
        showCommunities: tempPrefs.showCommunities,
        showConcerns: tempPrefs.showConcerns,
        showAgeRange: tempPrefs.showAgeRange,
      }
    );

    if (success) {
      setShowOnboarding(false);
      await loadData();
      setMessage({ type: 'success', text: 'Welcome to Peer Support! Finding your matches...' });
    } else {
      setMessage({ type: 'error', text: 'Failed to opt in. Please try again.' });
    }
    setSaving(false);
  };

  const handleOptOut = async () => {
    if (window.confirm('Are you sure you want to opt out of peer support? Your existing connections will be preserved.')) {
      setSaving(true);
      const success = await peerSupportService.optOutOfPeerSupport(userId);
      if (success) {
        setPreferences(prev => prev ? { ...prev, optedIn: false } : null);
        setShowOnboarding(true);
        setMessage({ type: 'success', text: 'You have opted out of peer support.' });
      }
      setSaving(false);
    }
  };

  const handleConnect = async (matchUserId: string) => {
    const result = await peerSupportService.sendConnectionRequest(userId, matchUserId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Connection request sent!' });
      // Update the match status
      setMatches(prev => prev.map(m => 
        m.userId === matchUserId ? { ...m, connectionStatus: 'pending' } : m
      ));
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to send request' });
    }
  };

  const handleAcceptRequest = async (connectionId: string) => {
    const success = await peerSupportService.acceptConnectionRequest(connectionId, userId);
    if (success) {
      setMessage({ type: 'success', text: 'Connection accepted!' });
      await loadData();
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    const success = await peerSupportService.declineConnectionRequest(connectionId, userId);
    if (success) {
      setPendingRequests(prev => ({
        ...prev,
        received: prev.received.filter(r => r.id !== connectionId),
      }));
    }
  };

  const toggleSupportType = (type: PeerSupportType) => {
    setTempPrefs(prev => {
      const current = prev.availableFor || [];
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return { ...prev, availableFor: updated };
    });
  };

  // Dismiss message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="peer-support-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading peer support...</p>
        </div>
      </div>
    );
  }

  // Onboarding flow
  if (showOnboarding) {
    return (
      <div className="peer-support-container">
        <div className="peer-support-header">
          <h1 className="header-title">🤝 Peer Support</h1>
          <p className="header-subtitle">Connect with brothers who understand</p>
          {onClose && (
            <button className="close-button" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="onboarding-content">
          {onboardingStep === 0 && (
            <div className="onboarding-step">
              <div className="step-icon">🌟</div>
              <h2>Welcome to Peer Support</h2>
              <p>
                Sometimes the best support comes from someone who truly understands your experience.
                Our peer support feature connects you with other men from similar backgrounds.
              </p>
              
              <div className="info-box">
                <h4>What to expect:</h4>
                <ul>
                  <li>✓ Matched with men who share your cultural background</li>
                  <li>✓ Anonymous connections - use a display name</li>
                  <li>✓ You control what information is shared</li>
                  <li>✓ Professional support always available</li>
                </ul>
              </div>

              <div className="safety-note">
                <strong>⚠️ Important:</strong> Peer support is not a replacement for professional help.
                If you're in crisis, please reach out to a professional or call 988.
              </div>

              <button className="primary-button" onClick={() => setOnboardingStep(1)}>
                Get Started
              </button>
              <button className="secondary-button" onClick={onClose}>
                Maybe Later
              </button>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="onboarding-step">
              <div className="step-icon">👤</div>
              <h2>Create Your Profile</h2>
              <p>Choose a display name that others will see. This helps keep you anonymous.</p>

              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={tempPrefs.displayName || ''}
                  onChange={(e) => setTempPrefs(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g., BrooklynBrother, ChiTownDad, QuietStrength"
                  maxLength={30}
                />
                <span className="helper-text">
                  This is how other peers will see you. Don't use your real name.
                </span>
              </div>

              <div className="button-group">
                <button className="secondary-button" onClick={() => setOnboardingStep(0)}>
                  Back
                </button>
                <button 
                  className="primary-button" 
                  onClick={() => setOnboardingStep(2)}
                  disabled={!tempPrefs.displayName?.trim()}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="onboarding-step">
              <div className="step-icon">💪</div>
              <h2>How Can You Help?</h2>
              <p>Select the types of support you're willing to provide to others.</p>

              <div className="support-types-grid">
                {PEER_SUPPORT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    className={`support-type-card ${tempPrefs.availableFor?.includes(type.value) ? 'selected' : ''}`}
                    onClick={() => toggleSupportType(type.value)}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-label">{type.label}</span>
                    <span className="type-description">{type.description}</span>
                  </button>
                ))}
              </div>

              <div className="button-group">
                <button className="secondary-button" onClick={() => setOnboardingStep(1)}>
                  Back
                </button>
                <button 
                  className="primary-button" 
                  onClick={() => setOnboardingStep(3)}
                  disabled={!tempPrefs.availableFor?.length}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="onboarding-step">
              <div className="step-icon">🔒</div>
              <h2>Privacy Settings</h2>
              <p>Control what information is visible to potential matches.</p>

              <div className="privacy-options">
                <label className="privacy-toggle">
                  <input
                    type="checkbox"
                    checked={tempPrefs.showCulturalBackground}
                    onChange={(e) => setTempPrefs(prev => ({ ...prev, showCulturalBackground: e.target.checked }))}
                  />
                  <div className="toggle-content">
                    <span className="toggle-label">Show Cultural Background</span>
                    <span className="toggle-description">Others can see your cultural background for better matching</span>
                  </div>
                </label>

                <label className="privacy-toggle">
                  <input
                    type="checkbox"
                    checked={tempPrefs.showCommunities}
                    onChange={(e) => setTempPrefs(prev => ({ ...prev, showCommunities: e.target.checked }))}
                  />
                  <div className="toggle-content">
                    <span className="toggle-label">Show Communities</span>
                    <span className="toggle-description">Show community identities (veteran, father, etc.)</span>
                  </div>
                </label>

                <label className="privacy-toggle">
                  <input
                    type="checkbox"
                    checked={tempPrefs.showAgeRange}
                    onChange={(e) => setTempPrefs(prev => ({ ...prev, showAgeRange: e.target.checked }))}
                  />
                  <div className="toggle-content">
                    <span className="toggle-label">Show Age Range</span>
                    <span className="toggle-description">Others can see your approximate age range</span>
                  </div>
                </label>

                <label className="privacy-toggle warning">
                  <input
                    type="checkbox"
                    checked={tempPrefs.showConcerns}
                    onChange={(e) => setTempPrefs(prev => ({ ...prev, showConcerns: e.target.checked }))}
                  />
                  <div className="toggle-content">
                    <span className="toggle-label">Show Concerns</span>
                    <span className="toggle-description">Show your mental health concerns (not recommended)</span>
                  </div>
                </label>
              </div>

              <div className="button-group">
                <button className="secondary-button" onClick={() => setOnboardingStep(2)}>
                  Back
                </button>
                <button 
                  className="primary-button" 
                  onClick={handleOptIn}
                  disabled={saving}
                >
                  {saving ? 'Setting Up...' : 'Join Peer Support'}
                </button>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`toast-message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="peer-support-container">
      {/* Header */}
      <div className="peer-support-header">
        <div className="header-content">
          <h1 className="header-title">🤝 Peer Support</h1>
          <p className="header-subtitle">Connect with brothers who understand</p>
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>✕</button>
        )}
      </div>

      {/* Tabs */}
      <div className="peer-tabs">
        <button 
          className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          <span className="tab-icon">🔍</span>
          Discover
        </button>
        <button 
          className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <span className="tab-icon">👥</span>
          Connections
          {pendingRequests.received.length > 0 && (
            <span className="badge">{pendingRequests.received.length}</span>
          )}
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="peer-content">
        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div className="discover-content">
            <h2 className="section-title">Suggested Matches</h2>
            <p className="section-subtitle">
              Brothers with similar backgrounds who opted into peer support
            </p>

            {matches.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <h3>No matches found yet</h3>
                <p>Check back later as more brothers join the community</p>
              </div>
            ) : (
              <div className="matches-list">
                {matches.map((match) => (
                  <div key={match.matchId} className="match-card">
                    <div className="match-header">
                      <div className="match-avatar">
                        {match.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="match-info">
                        <h3 className="match-name">{match.displayName}</h3>
                        <div className="match-score">
                          <span className="score-bar">
                            <span 
                              className="score-fill" 
                              style={{ width: `${match.matchScore}%` }}
                            />
                          </span>
                          <span className="score-text">{match.matchScore}% match</span>
                        </div>
                      </div>
                    </div>

                    {match.sharedTraits.length > 0 && (
                      <div className="shared-traits">
                        <span className="traits-label">In common:</span>
                        <div className="traits-list">
                          {match.sharedTraits.map((trait, i) => (
                            <span key={i} className="trait-chip">{trait}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="available-for">
                      <span className="for-label">Available for:</span>
                      <div className="for-list">
                        {match.availableFor.slice(0, 3).map((type) => {
                          const typeInfo = PEER_SUPPORT_TYPES.find(t => t.value === type);
                          return (
                            <span key={type} className="for-chip">
                              {typeInfo?.icon} {typeInfo?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="match-actions">
                      {match.connectionStatus === 'none' && (
                        <button 
                          className="connect-button"
                          onClick={() => handleConnect(match.userId)}
                        >
                          Connect
                        </button>
                      )}
                      {match.connectionStatus === 'pending' && (
                        <span className="pending-badge">Request Sent</span>
                      )}
                      {match.connectionStatus === 'connected' && (
                        <span className="connected-badge">Connected ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="connections-content">
            {/* Pending Requests */}
            {pendingRequests.received.length > 0 && (
              <div className="requests-section">
                <h2 className="section-title">Pending Requests</h2>
                <div className="requests-list">
                  {pendingRequests.received.map((request) => (
                    <div key={request.id} className="request-card">
                      <div className="request-info">
                        <span className="request-icon">📬</span>
                        <p>Someone wants to connect with you</p>
                      </div>
                      <div className="request-actions">
                        <button 
                          className="accept-button"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          Accept
                        </button>
                        <button 
                          className="decline-button"
                          onClick={() => handleDeclineRequest(request.id)}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Connections */}
            <div className="active-section">
              <h2 className="section-title">Your Connections</h2>
              
              {connections.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">👥</span>
                  <h3>No connections yet</h3>
                  <p>Find brothers to connect with in the Discover tab</p>
                  <button 
                    className="primary-button"
                    onClick={() => setActiveTab('discover')}
                  >
                    Browse Matches
                  </button>
                </div>
              ) : (
                <div className="connections-list">
                  {connections.map((conn) => (
                    <div key={conn.id} className="connection-card">
                      <div className="connection-avatar">
                        <span>👤</span>
                      </div>
                      <div className="connection-info">
                        <h3>Connected Peer</h3>
                        <p className="connection-date">
                          Connected {new Date(conn.acceptedAt || conn.createdAt).toLocaleDateString()}
                        </p>
                        {conn.messageCount > 0 && (
                          <p className="message-count">{conn.messageCount} messages exchanged</p>
                        )}
                      </div>
                      <button className="message-button">
                        💬 Message
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && preferences && (
          <div className="settings-content">
            <h2 className="section-title">Peer Support Settings</h2>

            <div className="settings-card">
              <h3>Your Display Name</h3>
              <p className="current-value">{preferences.displayName || 'Not set'}</p>
            </div>

            <div className="settings-card">
              <h3>Available For</h3>
              <div className="current-types">
                {preferences.availableFor.map((type) => {
                  const typeInfo = PEER_SUPPORT_TYPES.find(t => t.value === type);
                  return (
                    <span key={type} className="type-badge">
                      {typeInfo?.icon} {typeInfo?.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="settings-card">
              <h3>Privacy Settings</h3>
              <div className="privacy-summary">
                <div className="privacy-item">
                  <span>{preferences.showCulturalBackground ? '✓' : '✗'}</span>
                  Cultural Background
                </div>
                <div className="privacy-item">
                  <span>{preferences.showCommunities ? '✓' : '✗'}</span>
                  Communities
                </div>
                <div className="privacy-item">
                  <span>{preferences.showAgeRange ? '✓' : '✗'}</span>
                  Age Range
                </div>
                <div className="privacy-item">
                  <span>{preferences.showConcerns ? '✓' : '✗'}</span>
                  Concerns
                </div>
              </div>
            </div>

            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <button className="opt-out-button" onClick={handleOptOut}>
                Opt Out of Peer Support
              </button>
              <p className="danger-note">
                You can opt back in anytime. Existing connections will be preserved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Message */}
      {message && (
        <div className={`toast-message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
