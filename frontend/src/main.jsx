import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env.local');
}

const clerkAppearance = {
  layout: {
    logoImageUrl:  '/MindNote.png',
    logoPlacement: 'outside',   // renders logo above the card, not inside it
    logoLinkUrl:   '/',         // clicking the logo goes back to home
  },
  variables: {
    colorPrimary:        '#c9a84c',
    colorBackground:     '#131313',
    colorText:           '#f0ece0',
    colorTextSecondary:  '#b0b0b0',
    colorInputBackground:'#1e1e1e',
    colorInputText:      '#f0ece0',
    colorNeutral:        '#999999',
    colorDanger:         '#f87171',
    borderRadius:        '8px',
    fontFamily:          '"Manrope", sans-serif',
    fontSize:            '14px',
  },
  elements: {

    /* ── Sign-in / Sign-up card ── */
    card: {
      background: '#131313',
      border:     '1px solid #333333',
      boxShadow:  '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(201,168,76,0.1)',
    },
    headerTitle: {
      color:         '#f0ece0',
      fontFamily:    '"Epilogue", sans-serif',
      fontWeight:    700,
      letterSpacing: '-0.02em',
    },
    headerSubtitle: { color: '#a0a0a0' },

    /* ── Social buttons ── */
    socialButtonsIconButton: {
      background:   '#1e1e1e',
      border:       '1px solid #3a3a3a',
      borderRadius: '8px',
      boxShadow:    'none',
    },
    socialButtonsBlockButton:     { background: '#1e1e1e', border: '1px solid #3a3a3a', color: '#f0ece0' },
    socialButtonsBlockButtonText: { color: '#f0ece0' },

    /* ── Form ── */
    dividerLine:  { background: '#333333' },
    dividerText:  { color: '#777777' },
    formFieldLabel: { color: '#c0c0c0' },
    formFieldInput: { background: '#1e1e1e', border: '1px solid #3a3a3a', color: '#f0ece0' },
    formFieldInputShowPasswordButton: { color: '#888888' },
    formButtonPrimary: {
      background:    '#c9a84c',
      color:         '#0a0a0a',
      fontWeight:    700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      fontSize:      '12px',
    },
    footerActionText: { color: '#888888' },
    footerActionLink: { color: '#c9a84c' },
    identityPreviewText:       { color: '#f0ece0' },
    identityPreviewEditButton: { color: '#c9a84c' },

    /* ══════════════════════════════════════════════════════════
       UserButton popup panel (the mini card that appears on click)
       ══════════════════════════════════════════════════════════ */
    userButtonPopoverCard: {
      background: '#131313',
      border:     '1px solid #2a2a2a',
      boxShadow:  '0 16px 48px rgba(0,0,0,0.8)',
    },
    userButtonPopoverMain:           { background: '#131313' },
    userButtonPopoverFooter:         { background: '#0f0f0f', borderTop: '1px solid #222222' },
    userButtonPopoverFooterPages:    { background: '#0f0f0f' },

    /* Name + email shown at the top of the popup */
    userPreviewMainIdentifier:       { color: '#f0ece0', fontWeight: 600 },
    userPreviewSecondaryIdentifier:  { color: '#888888' },
    userPreviewAvatarBox:            { border: '2px solid #2a2a2a' },

    /* "Manage account" / "Sign out" rows */
    userButtonPopoverActionButton: {
      color:      '#d0ccc6',
      background: 'transparent',
    },
    userButtonPopoverActionButtonText: { color: '#d0ccc6' },
    userButtonPopoverActionButtonIcon: { color: '#888888' },

    /* "Secured by Clerk" text */
    userButtonPopoverFooterPagesLink:  { color: '#555555' },

    /* ══════════════════════════════════════════════════════════
       UserProfile page ("Manage account" full-page view)
       ══════════════════════════════════════════════════════════ */
    userProfile:                { background: '#131313' },
    userProfilePage:            { background: '#131313' },
    pageScrollBox:              { background: '#131313' },

    /* ── Left sidebar nav ── */
    navbar: {
      background:   '#0d0d0d',
      borderRight:  '1px solid #1e1e1e',
    },
    navbarSection:              { borderBottom: '1px solid #1a1a1a' },

    /* "Account" heading */
    navbarSectionHeader:        { color: '#f0ece0', fontWeight: 700 },

    /* "Manage your account info" subtitle */
    navbarHeader:               { color: '#666666' },
    navbarMobileMenuRow:        { background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' },

    /* Nav items: Profile / Security */
    navbarButton: {
      color:      '#a0a0a0',
      fontWeight: 500,
    },
    navbarButtonIcon:           { color: '#666666' },

    /* Active selected nav item */
    navbarButton__active: {
      color:      '#f0ece0',
      background: '#1e1e1e',
      fontWeight: 600,
    },

    /* ── Page header ("Profile details") ── */
    pageHeaderTitle:            { color: '#f0ece0', fontWeight: 700 },
    pageHeaderSubtitle:         { color: '#888888' },

    /* ── Profile section rows ── */
    profileSection:             { borderTop: '1px solid #1e1e1e' },
    profileSectionTitle:        { borderBottom: '1px solid #2a2a2a' },
    profileSectionTitleText:    { color: '#f0ece0', fontWeight: 600 },
    profileSectionContent:      { color: '#d0ccc6' },
    profileSectionPrimaryButton:{ color: '#c9a84c' },

    /* Profile item rows (name row, email row, connected account row) */
    profileSectionItem:         { borderBottom: '1px solid #1a1a1a' },
    profileSectionItemList:     { color: '#d0ccc6' },

    /* The "Priyanshu Madhup" name text in profile row */
    userPreviewMainIdentifier:  { color: '#f0ece0', fontWeight: 600 },
    userPreviewSecondaryIdentifier: { color: '#888888' },

    /* Email / connected account text */
    providerIcon:               { opacity: 1 },

    /* ── "..." three-dot action menu button ── */
    menuButton: {
      color:        '#888888',
      background:   'transparent',
      border:       '1px solid transparent',
      borderRadius: '6px',
      transition:   'color 0.15s, background 0.15s',
    },

    /* Dropdown that appears when "..." is clicked */
    menuList: {
      background: '#1a1a1a',
      border:     '1px solid #333333',
      boxShadow:  '0 8px 32px rgba(0,0,0,0.6)',
    },
    menuItem: {
      color:      '#d0ccc6',
      background: 'transparent',
    },

    /* "Update profile" link button */
    formButtonReset:            { color: '#c9a84c' },

    /* Accordion / detail rows */
    accordionTriggerButton:     { color: '#d0ccc6' },
    accordionContent:           { background: '#1a1a1a', borderTop: '1px solid #2a2a2a' },

    /* Badges ("Primary" tag on email) */
    badge:                      { background: '#222222', border: '1px solid #3a3a3a', color: '#b0b0b0' },
    tagInputContainer:          { background: '#1e1e1e', border: '1px solid #333' },

    /* Breadcrumb (top of page) */
    breadcrumbsItem:            { color: '#888888' },
    breadcrumbsItemDivider:     { color: '#555555' },
    breadcrumbsItem__currentPage:{ color: '#f0ece0' },

    /* Alert / destructive zone */
    alertText:                  { color: '#f87171' },
    destructiveActionLabelText: { color: '#f87171' },
  },
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/" appearance={clerkAppearance}>
      <App />
    </ClerkProvider>
  </StrictMode>,
);

