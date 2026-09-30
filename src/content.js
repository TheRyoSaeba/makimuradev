// Everything a visitor reads lives here — edit this file, not the components.

export const SITE = {
    name: 'MAKIMURA',
    tld: '.DEV',
    kanji: '槇村',
    handle: 'TheRyoSaeba',
    github: 'https://github.com/TheRyoSaeba',
}

// Rendered as episode title cards. `number` is display-only, so order is up to you.
export const EPISODES = [
    {
        number: '01',
        title: 'Makimura.dev',
        jp: '新宿の夜',
        desc: 'This site.',
        tags: ['React', 'Three.js', 'GLSL'],
        url: 'https://github.com/TheRyoSaeba/makimuradev',
        year: '2026',
    },
    {
        number: '02',
        title: 'My Placeholder',
        jp: '次の依頼',
        desc: '',
        tags: ['TBD'],
        url: 'https://google.com',
        year: '—',
    },
]

export const PROFILE = {
    file: '0001',
    summary: 'Hobbyist with a passion for an 80s anime.',
    // [label, value, optional view to open when clicked]
    fields: [
        ['HANDLE', 'TheRyoSaeba'],
        ['CONTACT', 'Leave an XYZ at the board', 'xyz'],
    ],
}

// Entries chalked onto the Shinjuku Station message board.
export const BOARD_LINKS = [
    { label: 'github / TheRyoSaeba', href: 'https://github.com/TheRyoSaeba' },
]
