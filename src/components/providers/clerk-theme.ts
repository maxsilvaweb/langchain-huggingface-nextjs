export const clerkAppearance = {
  variables: {
    colorPrimary: '#34d399',
    colorBackground: '#0a0a0a',
    colorInputBackground: 'rgba(255, 255, 255, 0.05)',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255, 255, 255, 0.6)',
    colorTextOnPrimaryBackground: '#052e16',
    colorDanger: '#f87171',
    borderRadius: '0.75rem',
    fontFamily: 'inherit',
    shadowShimmer: '0 0 transparent',
    shadowPrimary: '0 0 transparent',
  },
  elements: {
    card: 'border border-white/10 bg-zinc-900/70 shadow-none backdrop-blur-xl',
    headerTitle:
      'text-white text-2xl font-semibold tracking-tight md:text-[1.75rem]',
    headerSubtitle: 'text-white/55',
    socialButtonsBlockButton:
      'h-10 rounded-lg border border-white/10 bg-white/5 text-white shadow-none transition-colors hover:bg-white/10',
    socialButtonsBlockButtonText: 'text-sm font-medium',
    formButtonPrimary:
      'h-10 rounded-lg bg-emerald-400 text-black shadow-none transition-colors hover:bg-emerald-300',
    formFieldLabel: 'text-white/70 text-xs font-medium tracking-wide',
    formFieldInput:
      'h-10 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/35 shadow-none focus:border-emerald-400/45 focus:ring-0',
    footerActionLink: 'text-emerald-400 hover:text-emerald-300',
    identityPreviewText: 'text-white/70',
    formResendCodeLink: 'text-emerald-400 hover:text-emerald-300',
    navbarButton:
      'text-white/70 hover:bg-white/5 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white',
    userButtonPopoverCard:
      'border border-white/10 bg-zinc-900/90 text-white shadow-xl backdrop-blur-xl',
    userButtonPopoverActionButton:
      'text-white/75 hover:bg-white/5 hover:text-white',
    userButtonPopoverActionButton__signOut:
      'text-red-400 hover:bg-red-500/10 hover:text-red-300',
    userButtonPopoverFooter: 'hidden',
    badge: 'hidden',
  },
} as const;
