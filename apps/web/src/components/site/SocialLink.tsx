// lucide-react dropped brand/logo icons (Facebook, Instagram, YouTube, X) from
// its core set, so these four are hand-drawn inline — same convention this
// codebase already uses for the header's account icon.
const PATHS = {
  facebook: (
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <path d="M17.5 6.5h.01" strokeLinecap="round" strokeWidth="2.5" />
    </>
  ),
  youtube: (
    <>
      <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 000 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4L4 20" strokeLinecap="round" />,
} as const;

export function SocialLink({
  platform,
  href,
}: {
  platform: keyof typeof PATHS;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={platform}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft transition-all hover:-translate-y-0.5 hover:text-ink hover:shadow-soft"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        {PATHS[platform]}
      </svg>
    </a>
  );
}
