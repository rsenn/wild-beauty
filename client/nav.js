// Tabs of the main navigation (Show is the 3D gallery of all nodes). Tabs for
// pages that do not exist yet link to `/`; Login opens a dialog and the language tab is a list of flags, neither has an href.
export const navItems = (t, lang) => [
  { id: 'home', href: '/', label: t('nav.home'), caption: t('nav.home.caption') },
  { id: 'show', href: `/${lang}/gallery`, label: t('nav.show'), caption: t('nav.show.caption') },
  { id: 'tree', href: `/${lang}/tree`, label: t('nav.tree'), caption: t('nav.tree.caption') },
  { id: 'new', href: `/${lang}/new`, label: t('nav.new'), caption: t('nav.new.caption') },
  { id: 'login', label: t('nav.login'), caption: t('nav.login.caption') },
  { id: 'lang', label: t('nav.lang') },
];
