// The main tabs of the navigation (docs/DESIGN.md S7.2a): three always visible entries, each
// with an icon and a label that says what the page is for (Show is the card grid of galleries,
// Tree the graph of everything, New the editor). The caption is the link's tooltip. Home is the
// logo, or a small house tab on a page without the logo; the language and the account are menus
// of their own (Nav.js) and are not tabs.
export const mainTabs = (t, lang) => [
  { id: 'show', href: `/${lang}/view`, label: t('nav.show'), caption: t('nav.show.caption'), icon: 'galleries' },
  { id: 'tree', href: `/${lang}/tree`, label: t('nav.tree'), caption: t('nav.tree.caption'), icon: 'explore' },
  { id: 'new', href: `/${lang}/new`, label: t('nav.new'), caption: t('nav.new.caption'), icon: 'create' },
];

// the name shown for a logged-in user: the profile name, else the address up to the @
export const accountName = user => (user?.name || user?.email?.split('@')[0] || '').trim();
