import { StrictMode, useEffect, useMemo, useState, type CSSProperties, type MouseEvent, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';

type Severity = 'HIGH' | 'MEDIUM' | 'LOW';
type RiskTone = 'safe' | 'suspicious' | 'dangerous';
type ActionType = 'Warn User' | 'Remove Comment' | 'Temporary Mute' | 'Permanent Ban' | 'Approve & Clear';
type ReportStatus = 'Resolved' | 'Under Review' | 'Escalated';
type FeedTone = 'info' | 'warning' | 'success' | 'danger';
type ToastTone = 'info' | 'success' | 'warning' | 'danger';

interface ReportItem {
  id: string;
  username: string;
  issueType: string;
  severity: Severity;
  toxicCommentText: string;
  riskScore: number;
  aiConfidence: number;
  status: ReportStatus;
  warned: boolean;
  commentRemoved: boolean;
  muted: boolean;
  banned: boolean;
  approved: boolean;
  updateCount: number;
  timestamp: string;
}

interface RiskItem {
  label: string;
  tone: RiskTone;
  score: number;
}

interface SummaryState {
  toxicitySummary: string;
  moderationRecommendation: string;
  riskSeverity: string;
  tags: string[];
  violatedRules: string[];
}

interface ToastState {
  visible: boolean;
  message: string;
  tone: ToastTone;
}

interface FeedItem {
  id: string;
  text: string;
  isNew: boolean;
  tone: FeedTone;
  timestamp: string;
}

interface MetricCardData {
  label: string;
  value: string;
  detail: string;
  accent: string;
  trend: string;
}

// Web Audio API Synthesizer for High-Tech Sound Feedback (Zero external audio files needed)
class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  play(type: 'select' | 'action' | 'alert' | 'success' | 'danger') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'action') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.setValueAtTime(440, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'danger') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch {
      // Audio playback fails gracefully if browser policy blocks it before user gesture
    }
  }
}

const sfx = new SoundFX();

const usernames = [
  'u/ZeroMercy17',
  'u/NovaScam',
  'u/CrimsonEcho',
  'u/ByteRaider',
  'u/IronFlare',
  'u/VenomReply',
  'u/ShadowCaps',
  'u/GlitchMonger',
  'u/RiotCircuit',
  'u/AshenNova',
  'u/SnareDrop',
  'u/MalicePixel',
  'u/SpamOrbit',
  'u/ToxicHelix',
  'u/ColdTrigger',
  'u/CrashVandal',
  'u/ThreadSniper',
  'u/LagPhantom',
];

const issueProfiles = [
  {
    issueType: 'Harassment',
    severity: 'HIGH' as const,
    comment:
      'You are completely useless, nobody in this subreddit wants you here, and I will keep replying on every post until you leave.',
    riskBase: 92,
    confidenceBase: 95,
    tags: ['Personal Attack', 'Hostile Brigading', 'Rule 1 Breach'],
    rules: ['Rule 1: Remember the Human', 'Rule 2: No Harassment'],
  },
  {
    issueType: 'Spam Links',
    severity: 'MEDIUM' as const,
    comment:
      'Guaranteed 10x crypto airdrop! Click my telegram link immediately: t.me/free_crypto_drop. Mods are sleeping so claim now!',
    riskBase: 76,
    confidenceBase: 91,
    tags: ['Phishing Vector', 'Commercial Spam', 'Malicious Link'],
    rules: ['Rule 3: No Spam or Affiliate Links'],
  },
  {
    issueType: 'Hate Speech',
    severity: 'HIGH' as const,
    comment:
      'People like you do not belong in this community or this country. Go back where you came from and shut up.',
    riskBase: 97,
    confidenceBase: 98,
    tags: ['Identity Attack', 'Severe Slur', 'Zero Tolerance'],
    rules: ['Reddit Policy: Hate Speech', 'Subreddit Rule 1'],
  },
  {
    issueType: 'Threatening Language',
    severity: 'HIGH' as const,
    comment:
      'Keep talking and I will doxx your real name and city. Let us see how confident you are when people show up at your workplace.',
    riskBase: 94,
    confidenceBase: 96,
    tags: ['Physical Threat', 'Doxxing Attempt', 'Safety Hazard'],
    rules: ['Reddit Policy: Violent Threats', 'Subreddit Rule 1'],
  },
  {
    issueType: 'Impersonation',
    severity: 'MEDIUM' as const,
    comment:
      'OFFICIAL MODERATOR NOTICE: Your account has been reported. DM me your Discord username and account recovery email within 10 minutes or be banned.',
    riskBase: 78,
    confidenceBase: 88,
    tags: ['Mod Impersonation', 'Credential Phishing'],
    rules: ['Rule 4: Do Not Impersonate Staff'],
  },
  {
    issueType: 'Targeted Bullying',
    severity: 'HIGH' as const,
    comment:
      'Everyone mass-downvote this idiot and leave clown emojis in every thread they ever posted on. Make them delete their account.',
    riskBase: 88,
    confidenceBase: 93,
    tags: ['Brigade Callout', 'Mass Bullying'],
    rules: ['Rule 2: No Coordinated Harassment'],
  },
  {
    issueType: 'Misinformation',
    severity: 'LOW' as const,
    comment:
      'The developer team is secretly stealing all karma points to sell on the black market, do not trust any official announcements.',
    riskBase: 54,
    confidenceBase: 79,
    tags: ['Conspiracy Rumor', 'Unverified Claim'],
    rules: ['Rule 7: Verifiable Sources Required'],
  },
];

const liveEventTemplates = [
  'New phishing spam intercepted',
  'Toxicity spike detected in thread',
  'User shadow-muted by Sentinel',
  'High-confidence hate speech flagged',
  'Incident escalated to Senior Moderator',
  'Bot account network quarantined',
];

const statusCycle: ReportStatus[] = ['Under Review', 'Escalated', 'Resolved'];

const dashboardGlobalCss = `
  :root {
    color-scheme: dark;
    --rg-bg: #07090e;
    --rg-surface: rgba(15, 19, 29, 0.88);
    --rg-surface-strong: rgba(20, 26, 40, 0.95);
    --rg-surface-soft: rgba(25, 33, 51, 0.7);
    --rg-text: #f1f5f9;
    --rg-text-strong: #ffffff;
    --rg-muted: #94a3b8;
    --rg-muted-soft: #64748b;
    --rg-line: rgba(255, 255, 255, 0.08);
    --rg-line-strong: rgba(255, 69, 0, 0.35);
    --rg-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
    --rg-shadow-strong: 0 24px 56px rgba(0, 0, 0, 0.6);
    --rg-reddit-orange: #ff4500;
    --rg-primary: #ff3355;
    --rg-primary-soft: rgba(255, 51, 85, 0.12);
    --rg-purple: #a855f7;
    --rg-purple-soft: rgba(168, 85, 247, 0.12);
    --rg-cyan: #38bdf8;
    --rg-cyan-soft: rgba(56, 189, 248, 0.12);
    --rg-green: #10b981;
    --rg-green-soft: rgba(16, 185, 129, 0.12);
    --rg-orange: #f97316;
    --rg-orange-soft: rgba(249, 115, 22, 0.12);
    --rg-alert: linear-gradient(90deg, rgba(38, 16, 22, 0.95), rgba(20, 24, 38, 0.95));
  }

  html, body {
    background-color: var(--rg-bg);
    color: var(--rg-text);
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .guardian-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 69, 0, 0.4) transparent;
  }

  .guardian-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .guardian-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .guardian-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #ff4500, #a855f7);
    border-radius: 999px;
  }

  @keyframes pulseRing {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.3); opacity: 0.2; }
    100% { transform: scale(0.95); opacity: 0.8; }
  }

  .live-pulse-anim {
    animation: pulseRing 2s infinite ease-in-out;
  }

  @keyframes shimmerAnim {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .shimmer-active {
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,69,0,0.15) 50%, rgba(255,255,255,0.03) 75%);
    background-size: 200% 100%;
    animation: shimmerAnim 1.5s infinite;
  }
`;

const styles: Record<string, CSSProperties> = {
  app: {
    minHeight: '100vh',
    margin: 0,
    padding: '24px 16px 40px',
    background:
      'radial-gradient(circle at 10% 10%, rgba(255, 69, 0, 0.12), transparent 28%), radial-gradient(circle at 90% 15%, rgba(168, 85, 247, 0.1), transparent 30%), radial-gradient(circle at 50% 90%, rgba(56, 189, 248, 0.08), transparent 32%), #07090e',
    color: 'var(--rg-text)',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    justifyContent: 'center',
    boxSizing: 'border-box',
    position: 'relative',
  },
  shell: {
    width: '100%',
    maxWidth: '1240px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '22px 28px',
    borderRadius: '24px',
    background: 'var(--rg-surface)',
    border: '1px solid var(--rg-line)',
    boxShadow: 'var(--rg-shadow-strong)',
    backdropFilter: 'blur(16px)',
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  shield: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #ff4500 0%, #dc2626 60%, #9333ea 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 28px rgba(255, 69, 0, 0.35)',
    flexShrink: 0,
    border: '1px solid rgba(255, 255, 255, 0.25)',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    fontWeight: 900,
    background: 'linear-gradient(90deg, #ffffff 0%, #ff8a65 40%, #c084fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    margin: 0,
    color: 'var(--rg-muted)',
    fontSize: '13px',
    lineHeight: 1.4,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
    color: 'var(--rg-text)',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 180ms ease',
  },
  headerBtnActive: {
    background: 'rgba(255, 69, 0, 0.15)',
    borderColor: 'rgba(255, 69, 0, 0.4)',
    color: '#ff8a65',
  },
  monitorBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.04em',
  },
  pulseCore: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    background: '#10b981',
    boxShadow: '0 0 10px #10b981',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  analyticsCard: {
    padding: '20px 22px',
    borderRadius: '20px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
    boxShadow: 'var(--rg-shadow)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 200ms ease',
  },
  analyticsTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyticsLabel: {
    margin: 0,
    fontSize: '11px',
    letterSpacing: '0.08em',
    fontWeight: 800,
    color: 'var(--rg-muted)',
    textTransform: 'uppercase',
  },
  analyticsTrend: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.06)',
  },
  analyticsValue: {
    margin: '12px 0 6px',
    fontSize: '34px',
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: '-0.04em',
  },
  analyticsDetail: {
    margin: 0,
    color: 'var(--rg-muted)',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '14px 20px',
    borderRadius: '16px',
    background: 'var(--rg-alert)',
    border: '1px solid rgba(255, 69, 0, 0.3)',
    color: 'var(--rg-text)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    flexWrap: 'wrap',
  },
  alertLabel: {
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    color: '#ff5722',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  alertText: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 600,
    color: '#f8fafc',
    flex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(340px, 1.15fr) minmax(320px, 0.85fr)',
    gap: '20px',
    alignItems: 'start',
  },
  primaryColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0,
  },
  secondaryColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0,
  },
  card: {
    borderRadius: '24px',
    padding: '24px',
    background: 'var(--rg-surface)',
    border: '1px solid var(--rg-line)',
    boxShadow: 'var(--rg-shadow)',
    backdropFilter: 'blur(16px)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  cardTitleWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: 'var(--rg-text-strong)',
  },
  cardCaption: {
    margin: 0,
    color: 'var(--rg-muted)',
    fontSize: '12px',
  },
  badge: {
    padding: '6px 12px',
    borderRadius: '999px',
    background: 'rgba(255, 69, 0, 0.12)',
    border: '1px solid rgba(255, 69, 0, 0.3)',
    color: '#ff8a65',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.04em',
  },
  filterBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '12px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
    color: 'white',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 160ms ease',
  },
  filterPillRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterPill: {
    padding: '5px 10px',
    borderRadius: '999px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
    color: 'var(--rg-muted)',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 140ms ease',
  },
  filterPillActive: {
    background: 'rgba(255, 69, 0, 0.2)',
    borderColor: 'rgba(255, 69, 0, 0.5)',
    color: '#ffffff',
  },
  reportScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '520px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  reportButton: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    width: '100%',
    padding: '16px',
    borderRadius: '18px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
    transition: 'all 180ms ease',
    textAlign: 'left',
    cursor: 'pointer',
    boxSizing: 'border-box',
    position: 'relative',
  },
  avatar: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(255, 69, 0, 0.2), rgba(168, 85, 247, 0.2))',
    color: 'white',
    fontSize: '13px',
    fontWeight: 800,
    flexShrink: 0,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  reportText: {
    flex: 1,
    minWidth: 0,
  },
  reportTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    flexWrap: 'wrap',
  },
  reportUser: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 800,
    color: 'var(--rg-text-strong)',
    fontFamily: 'monospace',
  },
  reportSnippet: {
    margin: '8px 0 0',
    color: 'var(--rg-muted)',
    fontSize: '12px',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  reportMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '10px',
    alignItems: 'center',
  },
  miniPill: {
    padding: '3px 8px',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--rg-line)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
  summaryBox: {
    padding: '20px',
    borderRadius: '18px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
    color: 'var(--rg-text)',
    lineHeight: 1.6,
    fontSize: '14px',
  },
  commentBlock: {
    marginTop: '14px',
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(10, 13, 22, 0.8)',
    border: '1px solid var(--rg-line)',
    color: '#e2e8f0',
    fontSize: '13px',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
    marginTop: '12px',
  },
  actionBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '14px 10px',
    borderRadius: '16px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
    color: 'var(--rg-text)',
    cursor: 'pointer',
    transition: 'all 180ms ease',
    textAlign: 'center',
  },
  feedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '260px',
    overflowY: 'auto',
  },
  feedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '12px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
    fontSize: '12px',
    transition: 'all 160ms ease',
  },
  feedDot: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    flexShrink: 0,
  },
  feedText: {
    margin: 0,
    color: 'var(--rg-text)',
    flex: 1,
    lineHeight: 1.4,
  },
  feedTime: {
    fontSize: '10px',
    color: 'var(--rg-muted)',
    fontFamily: 'monospace',
  },
  riskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  riskRow: {
    padding: '12px 14px',
    borderRadius: '14px',
    background: 'var(--rg-surface-strong)',
    border: '1px solid var(--rg-line)',
  },
  riskTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: 700,
  },
  meterTrack: {
    width: '100%',
    height: '7px',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    padding: '14px 22px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: 800,
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    animation: 'toastIn 200ms ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '560px',
    borderRadius: '24px',
    background: '#0d111a',
    border: '1px solid rgba(255, 69, 0, 0.3)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
};

const severityStyles: Record<Severity, CSSProperties> = {
  HIGH: {
    color: '#ff3355',
    background: 'rgba(255, 51, 85, 0.14)',
    borderColor: 'rgba(255, 51, 85, 0.35)',
  },
  MEDIUM: {
    color: '#fb923c',
    background: 'rgba(251, 146, 60, 0.14)',
    borderColor: 'rgba(251, 146, 60, 0.35)',
  },
  LOW: {
    color: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.14)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
};

const statusStyles: Record<ReportStatus, CSSProperties> = {
  'Under Review': {
    color: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  Escalated: {
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.14)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  Resolved: {
    color: '#34d399',
    background: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
};

const riskToneStyles: Record<RiskTone, { dot: string; bar: string; border: string }> = {
  safe: {
    dot: '#10b981',
    bar: 'linear-gradient(90deg, #059669, #10b981)',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  suspicious: {
    dot: '#f59e0b',
    bar: 'linear-gradient(90deg, #d97706, #fbbf24)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  dangerous: {
    dot: '#ef4444',
    bar: 'linear-gradient(90deg, #dc2626, #f87171)',
    border: 'rgba(239, 68, 68, 0.4)',
  },
};

const feedToneStyles: Record<FeedTone, { dot: string; border: string }> = {
  info: { dot: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' },
  warning: { dot: '#fbbf24', border: 'rgba(251, 191, 36, 0.35)' },
  success: { dot: '#34d399', border: 'rgba(52, 211, 153, 0.35)' },
  danger: { dot: '#ef4444', border: 'rgba(239, 68, 68, 0.35)' },
};

const toastToneStyles: Record<ToastTone, CSSProperties> = {
  info: { background: '#0284c7', color: '#ffffff' },
  success: { background: '#059669', color: '#ffffff' },
  warning: { background: '#d97706', color: '#ffffff' },
  danger: { background: '#dc2626', color: '#ffffff' },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getTimeLabel = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const getInitials = (username: string) =>
  username
    .replace('u/', '')
    .slice(0, 2)
    .toUpperCase();

function createSummary(report: ReportItem): SummaryState {
  const riskSeverity =
    report.riskScore >= 85 ? 'HIGH' : report.riskScore >= 65 ? 'MEDIUM' : 'LOW';

  const profile = issueProfiles.find((p) => p.issueType === report.issueType) ?? issueProfiles[0]!;

  const statusContext =
    report.status === 'Resolved'
      ? 'Intervention completed. Account quarantined and content sanitized.'
      : report.status === 'Escalated'
        ? 'High toxicity persistence detected. Subreddit escalation threshold triggered.'
        : 'Active review pipeline monitoring incoming community feedback.';

  const toxicitySummary = `${report.issueType} markers detected in interactions from ${report.username}. Flagged language exhibits ${report.severity} severity intent with a live risk index of ${report.riskScore}%. ${statusContext}`;

  const moderationRecommendation =
    report.status === 'Resolved'
      ? 'Recommendation: Keep automated watch active. Content already sanitized.'
      : report.riskScore >= 90
        ? 'Urgent Recommendation: Immediate comment removal + 7-day user mute + add to platform spam blacklist.'
        : report.riskScore >= 70
          ? 'Recommendation: Remove comment and issue an official moderator strike.'
          : 'Recommendation: Flag for observational review. No immediate punitive ban required.';

  return {
    toxicitySummary,
    moderationRecommendation,
    riskSeverity,
    tags: profile.tags,
    violatedRules: profile.rules,
  };
}

function generateInitialReports(total = 18): ReportItem[] {
  return Array.from({ length: total }, (_, index) => {
    const profile = issueProfiles[index % issueProfiles.length] ?? issueProfiles[0]!;
    const status = statusCycle[index % statusCycle.length] ?? 'Under Review';
    const riskScore = clamp(profile.riskBase + ((index * 7) % 13) - 6, 48, 99);
    const aiConfidence = clamp(profile.confidenceBase + ((index * 5) % 11) - 5, 72, 99);

    return {
      id: `report-${index + 1}`,
      username: usernames[index % usernames.length] ?? `u/Guardian${index + 1}`,
      issueType: profile.issueType,
      severity: profile.severity,
      toxicCommentText: profile.comment,
      riskScore,
      aiConfidence,
      status,
      warned: status === 'Escalated',
      commentRemoved: status === 'Resolved',
      muted: status === 'Escalated',
      banned: false,
      approved: false,
      updateCount: index % 3,
      timestamp: `${(index + 1) * 2}m ago`,
    };
  });
}

export function App() {
  const [reports, setReports] = useState<ReportItem[]>(() => generateInitialReports(18));
  const [selectedReportId, setSelectedReportId] = useState<string>('report-1');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReportStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [streamActive, setStreamActive] = useState(true);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Custom Incident state
  const [newUsername, setNewUsername] = useState('u/TestUser99');
  const [newComment, setNewComment] = useState('');
  const [newIssueType, setNewIssueType] = useState('Harassment');

  const [activityFeed, setActivityFeed] = useState<FeedItem[]>([
    {
      id: 'feed-init-1',
      text: 'AI Sentinel initialized. Subreddit modqueue synchronized.',
      isNew: false,
      tone: 'success',
      timestamp: getTimeLabel(),
    },
    {
      id: 'feed-init-2',
      text: 'DeepSeek-V3 LLM connected for real-time semantic analysis.',
      isNew: false,
      tone: 'info',
      timestamp: getTimeLabel(),
    },
    {
      id: 'feed-init-3',
      text: '18 incidents triaged automatically by risk vector.',
      isNew: false,
      tone: 'warning',
      timestamp: getTimeLabel(),
    },
  ]);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    tone: 'success',
  });

  const [liveAlert, setLiveAlert] = useState('Autonomous community radar scanning incoming comments.');
  const [aiActionsToday, setAiActionsToday] = useState(184);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0],
    [reports, selectedReportId]
  );

  const summary = useMemo(
    () =>
      selectedReport
        ? createSummary(selectedReport)
        : {
            toxicitySummary: 'No report selected.',
            moderationRecommendation: 'Recommendation unavailable.',
            riskSeverity: 'LOW',
            tags: [],
            violatedRules: [],
          },
    [selectedReport]
  );

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSeverity = severityFilter === 'ALL' || r.severity === severityFilter;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.toxicCommentText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.issueType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSeverity && matchStatus && matchSearch;
    });
  }, [reports, severityFilter, statusFilter, searchQuery]);

  // Analytics computation
  const analytics = useMemo<MetricCardData[]>(() => {
    const activeReports = reports.filter((report) => report.status !== 'Resolved').length;
    const highRiskUsers = reports.filter(
      (report) => report.riskScore >= 80 || report.status === 'Escalated'
    ).length;
    const resolved = reports.filter((report) => report.status === 'Resolved').length;
    const efficiency = clamp(
      Math.round((resolved / (reports.length || 1)) * 100 + aiActionsToday / 25),
      74,
      99
    );

    return [
      {
        label: 'Active Incident Queue',
        value: `${activeReports}`,
        detail: `${reports.length} total community flags loaded`,
        accent: '#ffffff',
        trend: '+4 last hr',
      },
      {
        label: 'Critical Threats',
        value: `${highRiskUsers}`,
        detail: 'Risk score ≥ 80% or active escalation',
        accent: '#ff3355',
        trend: '🚨 High Priority',
      },
      {
        label: 'AI Actions Executed',
        value: `${aiActionsToday}`,
        detail: 'Warnings, removes, mutes & bans this shift',
        accent: '#38bdf8',
        trend: '⚡ Autonomous',
      },
      {
        label: 'Subreddit Health Rating',
        value: `${efficiency}%`,
        detail: `${resolved} cases successfully resolved`,
        accent: '#34d399',
        trend: '🛡️ Protected',
      },
    ];
  }, [aiActionsToday, reports]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toast.visible) return;
    const timer = window.setTimeout(() => {
      setToast((c) => ({ ...c, visible: false }));
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [toast.visible]);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
    if (next) {
      sfx.play('select');
    }
  };

  // Real-time live threat ticker simulation
  useEffect(() => {
    if (!streamActive) return;

    const liveTimer = window.setInterval(() => {
      setReports((currentReports) => {
        if (currentReports.length === 0) return currentReports;
        const targetIndex = Math.floor(Math.random() * currentReports.length);
        const eventIndex = Math.floor(Math.random() * liveEventTemplates.length);
        const target = currentReports[targetIndex];
        if (!target) return currentReports;

        const event = liveEventTemplates[eventIndex]!;
        let nextStatus = target.status;
        let nextRisk = target.riskScore;
        let tone: FeedTone = 'info';

        if (event.includes('spike') || event.includes('hate speech')) {
          nextStatus = 'Escalated';
          nextRisk = clamp(target.riskScore + 6, 50, 99);
          tone = 'danger';
        } else if (event.includes('quarantined') || event.includes('muted')) {
          nextStatus = 'Escalated';
          nextRisk = clamp(target.riskScore - 4, 35, 99);
          tone = 'warning';
        } else {
          nextStatus = target.status === 'Resolved' ? 'Under Review' : target.status;
          nextRisk = clamp(target.riskScore + 2, 40, 99);
          tone = 'info';
        }

        setLiveAlert(`${event}: ${target.username} (${target.issueType}) at ${getTimeLabel()}`);

        setActivityFeed((curr) =>
          [
            {
              id: `feed-live-${Date.now()}`,
              text: `${event} for ${target.username}. Risk score now ${nextRisk}%.`,
              isNew: true,
              tone,
              timestamp: getTimeLabel(),
            },
            ...curr.map((i) => ({ ...i, isNew: false })),
          ].slice(0, 8)
        );

        sfx.play('alert');

        return currentReports.map((r, i) =>
          i === targetIndex
            ? {
                ...r,
                status: nextStatus,
                riskScore: nextRisk,
                updateCount: r.updateCount + 1,
              }
            : r
        );
      });
    }, 4500);

    return () => window.clearInterval(liveTimer);
  }, [streamActive]);

  // Select Report
  const handleSelectReport = (report: ReportItem) => {
    setSelectedReportId(report.id);
    sfx.play('select');
    setActivityFeed((curr) =>
      [
        {
          id: `feed-select-${Date.now()}`,
          text: `Moderator inspected case for ${report.username} [${report.issueType}].`,
          isNew: true,
          tone: 'info' as FeedTone,
          timestamp: getTimeLabel(),
        },
        ...curr.map((i) => ({ ...i, isNew: false })),
      ].slice(0, 8)
    );
  };

  // Moderator Action execution
  const handleAction = (action: ActionType) => {
    if (!selectedReport) return;

    let nextStatus: ReportStatus = selectedReport.status;
    let toastMsg = '';
    let toastTone: ToastTone = 'success';
    let feedTone: FeedTone = 'success';

    if (action === 'Warn User') {
      nextStatus = 'Under Review';
      toastMsg = `⚠️ Official moderator strike issued to ${selectedReport.username}`;
      toastTone = 'warning';
      feedTone = 'warning';
      sfx.play('action');
    } else if (action === 'Remove Comment') {
      nextStatus = 'Resolved';
      toastMsg = `🗑️ Comment deleted from thread. Case sanitized for ${selectedReport.username}`;
      toastTone = 'success';
      feedTone = 'success';
      sfx.play('success');
    } else if (action === 'Temporary Mute') {
      nextStatus = 'Escalated';
      toastMsg = `🔕 72-hour quarantine applied to ${selectedReport.username}`;
      toastTone = 'info';
      feedTone = 'info';
      sfx.play('action');
    } else if (action === 'Permanent Ban') {
      nextStatus = 'Resolved';
      toastMsg = `🔨 ${selectedReport.username} has been permanently banned from the subreddit`;
      toastTone = 'danger';
      feedTone = 'danger';
      sfx.play('danger');
    } else if (action === 'Approve & Clear') {
      nextStatus = 'Resolved';
      toastMsg = `🛡️ Comment approved. False positive cleared for ${selectedReport.username}`;
      toastTone = 'success';
      feedTone = 'success';
      sfx.play('success');
    }

    setReports((current) =>
      current.map((r) =>
        r.id === selectedReport.id
          ? {
              ...r,
              status: nextStatus,
              warned: action === 'Warn User' ? true : r.warned,
              commentRemoved: action === 'Remove Comment' ? true : r.commentRemoved,
              muted: action === 'Temporary Mute' ? true : r.muted,
              banned: action === 'Permanent Ban' ? true : r.banned,
              approved: action === 'Approve & Clear' ? true : r.approved,
              riskScore:
                action === 'Approve & Clear'
                  ? 12
                  : action === 'Remove Comment' || action === 'Permanent Ban'
                    ? clamp(r.riskScore - 20, 20, 99)
                    : r.riskScore,
            }
          : r
      )
    );

    setToast({
      visible: true,
      message: toastMsg,
      tone: toastTone,
    });

    setAiActionsToday((c) => c + 1);

    setActivityFeed((curr) =>
      [
        {
          id: `feed-act-${Date.now()}`,
          text: `${action} executed for ${selectedReport.username}. Status updated to ${nextStatus}.`,
          isNew: true,
          tone: feedTone,
          timestamp: getTimeLabel(),
        },
        ...curr.map((i) => ({ ...i, isNew: false })),
      ].slice(0, 8)
    );
  };

  // Deep AI Scan
  const handleRunAiScan = async () => {
    if (!selectedReport) return;
    setIsAiScanning(true);
    sfx.play('select');

    try {
      // Try to call server API
      const res = await fetch('/api/moderation-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: [selectedReport.toxicCommentText] }),
      });

      if (res.ok) {
        const data = await res.json();
        setToast({
          visible: true,
          message: `DeepSeek AI scan complete: ${data.riskSeverity} severity verified`,
          tone: 'info' as FeedTone,
        });
      } else {
        // Fallback simulation
        await new Promise((r) => setTimeout(r, 800));
        setToast({
          visible: true,
          message: `DeepSeek AI deep analysis complete: High confidence verified`,
          tone: 'info' as FeedTone,
        });
      }
    } catch {
      await new Promise((r) => setTimeout(r, 600));
      setToast({
        visible: true,
        message: `AI semantic threat analysis complete for ${selectedReport.username}`,
        tone: 'info',
      });
    } finally {
      setIsAiScanning(false);
      sfx.play('success');
    }
  };

  // Auto-resolve all low risk
  const handleAutoResolveLow = () => {
    const lowCount = reports.filter((r) => r.severity === 'LOW' && r.status !== 'Resolved').length;
    if (lowCount === 0) {
      setToast({ visible: true, message: 'No unresolved low-risk cases in queue', tone: 'info' });
      return;
    }
    setReports((curr) =>
      curr.map((r) => (r.severity === 'LOW' ? { ...r, status: 'Resolved', approved: true } : r))
    );
    setAiActionsToday((c) => c + lowCount);
    sfx.play('success');
    setToast({
      visible: true,
      message: `⚡ Auto-cleared ${lowCount} low-risk reports with AI consensus`,
      tone: 'success',
    });
  };

  // Create Custom Incident
  const handleCreateCustomIncident = (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const risk = newIssueType === 'Hate Speech' || newIssueType === 'Threatening Language' ? 95 : 75;
    const sev: Severity = risk >= 85 ? 'HIGH' : 'MEDIUM';

    const newReport: ReportItem = {
      id: `custom-${Date.now()}`,
      username: newUsername.startsWith('u/') ? newUsername : `u/${newUsername}`,
      issueType: newIssueType,
      severity: sev,
      toxicCommentText: newComment.trim(),
      riskScore: risk,
      aiConfidence: 96,
      status: 'Under Review',
      warned: false,
      commentRemoved: false,
      muted: false,
      banned: false,
      approved: false,
      updateCount: 1,
      timestamp: 'Just now',
    };

    setReports([newReport, ...reports]);
    setSelectedReportId(newReport.id);
    setShowNewModal(false);
    setNewComment('');
    sfx.play('success');
    setToast({
      visible: true,
      message: `Custom incident queued & selected: ${newReport.username}`,
      tone: 'success',
    });
  };

  // Export Audit Log
  const handleExportLog = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ exportedAt: new Date().toISOString(), activityFeed, reports }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `red-guardian-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToast({ visible: true, message: '📥 Mod audit log exported as JSON', tone: 'info' });
  };

  const dynamicRiskItems: RiskItem[] = useMemo(() => {
    if (!selectedReport) return [];
    return [
      {
        label: 'Community Safe Zone',
        tone: 'safe',
        score: selectedReport.status === 'Resolved' ? 88 : Math.max(15, 100 - selectedReport.riskScore),
      },
      {
        label: 'Suspicious Behavior Index',
        tone: 'suspicious',
        score: selectedReport.riskScore >= 70 ? 75 : selectedReport.riskScore,
      },
      {
        label: 'Critical Threat Vector',
        tone: 'dangerous',
        score: selectedReport.status === 'Resolved' ? 12 : selectedReport.riskScore,
      },
    ];
  }, [selectedReport]);

  return (
    <div style={styles.app}>
      <style>{dashboardGlobalCss}</style>

      {/* Floating Toast Notification */}
      {toast.visible && (
        <div style={{ ...styles.toast, ...toastToneStyles[toast.tone] }}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Test Custom Incident Modal */}
      {showNewModal && (
        <div style={styles.modalOverlay} onClick={() => setShowNewModal(false)}>
          <div style={styles.modalContent} onClick={(e: MouseEvent) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ff4500' }}>
                  + Test Custom Mod Incident
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--rg-muted)', fontSize: '12px' }}>
                  Input custom text to test DeepSeek AI threat detection in real-time.
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--rg-muted)',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomIncident} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rg-muted)' }}>Reddit Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={styles.searchInput}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rg-muted)' }}>Violation Type</label>
                <select
                  value={newIssueType}
                  onChange={(e) => setNewIssueType(e.target.value)}
                  style={{ ...styles.searchInput, background: '#161b26', cursor: 'pointer' }}
                >
                  <option value="Harassment">Harassment</option>
                  <option value="Spam Links">Spam Links</option>
                  <option value="Hate Speech">Hate Speech</option>
                  <option value="Threatening Language">Threatening Language</option>
                  <option value="Impersonation">Impersonation</option>
                  <option value="Targeted Bullying">Targeted Bullying</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rg-muted)' }}>Flagged Comment Text</label>
                  <span style={{ fontSize: '11px', color: '#ff8a65', cursor: 'pointer' }} onClick={() => setNewComment('You are trash, I will find where you live and spam your profile forever.')}>
                    Insert Sample Threat
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Paste or type toxic or spam comment to analyze..."
                  style={{ ...styles.searchInput, resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{ ...styles.headerBtn, flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.headerBtn,
                    flex: 1,
                    justifyContent: 'center',
                    background: 'linear-gradient(90deg, #ff4500, #dc2626)',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  ⚡ Run AI Detection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main style={styles.shell}>
        {/* Header Bar */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.shield}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div style={styles.titleBlock}>
              <h1 style={styles.title}>Red-Guard</h1>
              <p style={styles.subtitle}>
                <span>Reddit Autonomous Mod Copilot</span>
                <span>•</span>
                <span style={{ color: '#38bdf8' }}>Devvit 2.0 Webview</span>
                <span>•</span>
                <span style={{ color: '#c084fc' }}>DeepSeek-V3</span>
              </p>
            </div>
          </div>

          <div style={styles.headerRight}>
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              style={{ ...styles.headerBtn, ...(soundEnabled ? styles.headerBtnActive : {}) }}
              title="Toggle audio synth feedback"
            >
              {soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
            </button>

            {/* Stream Toggle */}
            <button
              onClick={() => setStreamActive(!streamActive)}
              style={{ ...styles.headerBtn, ...(streamActive ? styles.headerBtnActive : {}) }}
              title="Pause or resume live incoming threat stream"
            >
              {streamActive ? '🟢 Live Stream: Active' : '⏸️ Stream: Paused'}
            </button>

            {/* Test Incident Button */}
            <button
              onClick={() => setShowNewModal(true)}
              style={{
                ...styles.headerBtn,
                background: 'linear-gradient(90deg, #ff4500, #e11d48)',
                color: 'white',
                border: 'none',
              }}
            >
              + Test Incident
            </button>

            {/* Live Sentinel Badge */}
            <div style={styles.monitorBadge}>
              <span style={styles.pulseCore} className="live-pulse-anim" />
              SENTINEL ONLINE
            </div>
          </div>
        </header>

        {/* 4 Analytics Metric Cards */}
        <section style={styles.analyticsGrid}>
          {analytics.map((item) => (
            <article key={item.label} style={styles.analyticsCard}>
              <div style={styles.analyticsTop}>
                <p style={styles.analyticsLabel}>{item.label}</p>
                <span style={styles.analyticsTrend}>{item.trend}</span>
              </div>
              <p style={{ ...styles.analyticsValue, color: item.accent }}>{item.value}</p>
              <p style={styles.analyticsDetail}>{item.detail}</p>
            </article>
          ))}
        </section>

        {/* Live Threat Banner */}
        <div style={styles.alertBanner}>
          <div style={styles.alertLabel}>
            <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#ff4500' }} className="live-pulse-anim" />
            LIVE RADAR
          </div>
          <p style={styles.alertText}>{liveAlert}</p>
          <button
            onClick={handleAutoResolveLow}
            style={{
              ...styles.headerBtn,
              fontSize: '11px',
              padding: '6px 12px',
              background: 'rgba(52, 211, 153, 0.15)',
              borderColor: 'rgba(52, 211, 153, 0.4)',
              color: '#34d399',
            }}
          >
            ⚡ Auto-Clear Low Risk
          </button>
        </div>

        {/* Main Grid: Queue & Detail */}
        <section style={styles.grid}>
          {/* Left Column: Moderation Queue */}
          <div style={styles.primaryColumn}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleWrap}>
                  <h2 style={styles.cardTitle}>Live Incident Queue</h2>
                  <p style={styles.cardCaption}>
                    Showing {filteredReports.length} of {reports.length} community cases
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={styles.badge}>{filteredReports.length} Active</span>
                </div>
              </div>

              {/* Search & Filters */}
              <div style={styles.filterBar}>
                <input
                  type="text"
                  placeholder="🔍 Search users, comments, or issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
                <div style={styles.filterPillRow}>
                  <span style={{ fontSize: '11px', color: 'var(--rg-muted)', marginRight: '4px' }}>Severity:</span>
                  {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      style={{
                        ...styles.filterPill,
                        ...(severityFilter === sev ? styles.filterPillActive : {}),
                      }}
                    >
                      {sev}
                    </button>
                  ))}
                  <span style={{ fontSize: '11px', color: 'var(--rg-muted)', marginLeft: '8px', marginRight: '4px' }}>Status:</span>
                  {(['ALL', 'Under Review', 'Escalated', 'Resolved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        ...styles.filterPill,
                        ...(statusFilter === st ? styles.filterPillActive : {}),
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list */}
              <div style={styles.reportScroll} className="guardian-scroll">
                {filteredReports.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--rg-muted)' }}>
                    No reports match your filters.
                  </div>
                ) : (
                  filteredReports.map((report) => {
                    const isSelected = report.id === selectedReportId;
                    const sevStyle = severityStyles[report.severity];
                    const stStyle = statusStyles[report.status];

                    return (
                      <button
                        key={report.id}
                        onClick={() => handleSelectReport(report)}
                        style={{
                          ...styles.reportButton,
                          background: isSelected ? 'rgba(255, 69, 0, 0.08)' : 'var(--rg-surface-strong)',
                          borderColor: isSelected ? '#ff4500' : 'var(--rg-line)',
                          boxShadow: isSelected ? '0 0 20px rgba(255, 69, 0, 0.2)' : 'none',
                        }}
                      >
                        <div style={styles.avatar}>{getInitials(report.username)}</div>

                        <div style={styles.reportText}>
                          <div style={styles.reportTop}>
                            <span style={styles.reportUser}>{report.username}</span>
                            <span style={{ ...styles.miniPill, ...stStyle }}>{report.status}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ ...styles.miniPill, ...sevStyle }}>{report.severity}</span>
                            <span style={{ fontSize: '11px', color: 'var(--rg-muted)', fontWeight: 600 }}>
                              {report.issueType}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--rg-muted-soft)', marginLeft: 'auto' }}>
                              {report.timestamp}
                            </span>
                          </div>

                          <p style={styles.reportSnippet}>"{report.toxicCommentText}"</p>

                          <div style={styles.reportMeta}>
                            <span style={styles.miniPill}>⚡ AI Risk: {report.riskScore}%</span>
                            <span style={styles.miniPill}>🎯 Conf: {report.aiConfidence}%</span>
                            {report.warned && <span style={{ ...styles.miniPill, color: '#fbbf24' }}>⚠️ Warned</span>}
                            {report.commentRemoved && <span style={{ ...styles.miniPill, color: '#34d399' }}>🗑️ Removed</span>}
                            {report.muted && <span style={{ ...styles.miniPill, color: '#38bdf8' }}>🔕 Muted</span>}
                            {report.banned && <span style={{ ...styles.miniPill, color: '#ef4444' }}>🔨 Banned</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* AI Summary Card for selected item */}
            {selectedReport && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleWrap}>
                    <h2 style={styles.cardTitle}>DeepSeek AI Incident Triage</h2>
                    <p style={styles.cardCaption}>Synthesized analysis for {selectedReport.username}</p>
                  </div>
                  <button
                    onClick={handleRunAiScan}
                    disabled={isAiScanning}
                    style={{
                      ...styles.headerBtn,
                      background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                      color: 'white',
                      border: 'none',
                    }}
                  >
                    {isAiScanning ? '🧠 Scanning...' : '✨ DeepScan with AI'}
                  </button>
                </div>

                <div style={{ ...styles.summaryBox, ...(isAiScanning ? { opacity: 0.6 } : {}) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#ff8a65' }}>Analysis Verdict:</span>
                    <span style={{ ...styles.miniPill, ...severityStyles[selectedReport.severity] }}>
                      {summary.riskSeverity} SEVERITY
                    </span>
                  </div>

                  <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.6 }}>{summary.toxicitySummary}</p>

                  <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255, 69, 0, 0.08)', border: '1px solid rgba(255, 69, 0, 0.2)' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#ffedd5' }}>
                      {summary.moderationRecommendation}
                    </p>
                  </div>

                  {/* Flagged Comment */}
                  <div style={styles.commentBlock}>
                    <span style={{ fontSize: '11px', color: 'var(--rg-muted)', display: 'block', marginBottom: '4px', fontStyle: 'normal' }}>
                      FLAGGED EVIDENCE IN THREAD:
                    </span>
                    "{selectedReport.toxicCommentText}"
                  </div>

                  {/* Tags & Policy Violations */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {summary.tags.map((tag) => (
                      <span key={tag} style={{ ...styles.miniPill, color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.3)' }}>
                        #{tag}
                      </span>
                    ))}
                    {summary.violatedRules.map((rule) => (
                      <span key={rule} style={{ ...styles.miniPill, color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }}>
                        📋 {rule}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: One-Click Actions, Live Stream, Risk Radar */}
          <div style={styles.secondaryColumn}>
            {/* Moderator Action Terminal */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleWrap}>
                  <h2 style={styles.cardTitle}>Enforcement Actions</h2>
                  <p style={styles.cardCaption}>Take immediate action on {selectedReport?.username}</p>
                </div>
              </div>

              <div style={styles.actionGrid}>
                <button
                  onClick={() => handleAction('Warn User')}
                  style={{
                    ...styles.actionBtn,
                    borderColor: 'rgba(251, 191, 36, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>⚠️</span>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>Warn User</span>
                  <span style={{ fontSize: '10px', color: 'var(--rg-muted)' }}>Send Strike</span>
                </button>

                <button
                  onClick={() => handleAction('Remove Comment')}
                  style={{
                    ...styles.actionBtn,
                    borderColor: 'rgba(255, 69, 0, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🗑️</span>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>Remove</span>
                  <span style={{ fontSize: '10px', color: 'var(--rg-muted)' }}>Purge Content</span>
                </button>

                <button
                  onClick={() => handleAction('Temporary Mute')}
                  style={{
                    ...styles.actionBtn,
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🔕</span>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>Mute 72h</span>
                  <span style={{ fontSize: '10px', color: 'var(--rg-muted)' }}>Quarantine</span>
                </button>

                <button
                  onClick={() => handleAction('Permanent Ban')}
                  style={{
                    ...styles.actionBtn,
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🔨</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#f87171' }}>Ban User</span>
                  <span style={{ fontSize: '10px', color: 'var(--rg-muted)' }}>Permanent</span>
                </button>

                <button
                  onClick={() => handleAction('Approve & Clear')}
                  style={{
                    ...styles.actionBtn,
                    borderColor: 'rgba(52, 211, 153, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🛡️</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Approve</span>
                  <span style={{ fontSize: '10px', color: 'var(--rg-muted)' }}>Whitelist</span>
                </button>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleWrap}>
                  <h2 style={styles.cardTitle}>Live Mod Audit Feed</h2>
                  <p style={styles.cardCaption}>Automated detections & human interventions</p>
                </div>
                <button
                  onClick={handleExportLog}
                  style={{ ...styles.headerBtn, fontSize: '11px', padding: '5px 10px' }}
                >
                  📥 Export Log
                </button>
              </div>

              <div style={styles.feedList} className="guardian-scroll">
                {activityFeed.map((item) => {
                  const tone = feedToneStyles[item.tone];
                  return (
                    <div
                      key={item.id}
                      style={{
                        ...styles.feedRow,
                        borderColor: item.isNew ? tone.border : 'var(--rg-line)',
                        background: item.isNew ? 'rgba(255, 69, 0, 0.08)' : 'var(--rg-surface-strong)',
                      }}
                    >
                      <span style={{ ...styles.feedDot, background: tone.dot }} />
                      <p style={styles.feedText}>{item.text}</p>
                      <span style={styles.feedTime}>{item.timestamp}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Score & Threat Indicators */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleWrap}>
                  <h2 style={styles.cardTitle}>Threat Severity Index</h2>
                  <p style={styles.cardCaption}>Real-time telemetry for {selectedReport?.username}</p>
                </div>
              </div>

              <div style={styles.riskList}>
                {dynamicRiskItems.map((risk) => {
                  const tone = riskToneStyles[risk.tone];
                  return (
                    <div key={risk.label} style={styles.riskRow}>
                      <div style={styles.riskTop}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: tone.dot }} />
                          <span>{risk.label}</span>
                        </div>
                        <span style={{ color: tone.dot, fontWeight: 800 }}>{risk.score}%</span>
                      </div>
                      <div style={styles.meterTrack}>
                        <div
                          style={{
                            width: `${risk.score}%`,
                            height: '100%',
                            background: tone.bar,
                            borderRadius: '999px',
                            transition: 'width 300ms ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderRadius: '16px',
            background: 'var(--rg-surface)',
            border: '1px solid var(--rg-line)',
            fontSize: '12px',
            color: 'var(--rg-muted)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <span>Red-Guard | Reddit Mod Tools Hackathon Edition</span>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>Devvit Webview 2.0</span>
            <span>•</span>
            <span>OpenRouter DeepSeek-V3</span>
            <span>•</span>
            <span>React 19 + TypeScript</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
