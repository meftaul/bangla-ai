// The two emails behind "যে জিনিসে সংখ্যাই নাই" and the four ways they get
// measured. Shared by the scrolling figure (feature-figures.tsx) and the side
// lesson (representation-journey.tsx), so both measure the very same letters.
//
// Both are written so the live measures land on the article's table:
// spam (6, 14, 0.31, 1), normal (0, 1, 0.02, 0). Rewording either one moves
// its capitals share, so re-check it against the table after any edit.

export const SPAM_MAIL = `Subject: CONGRATULATIONS!!! You Have WON

DEAR LUCKY WINNER,

Your EMAIL has been SELECTED today. CLAIM your FREE iPHONE NOW,
100% free, delivery free, and a free gift card for the first 50
people. DO NOT WAIT, this free offer ends TONIGHT. You pay
nothing, it is ALL FREE.

CLAIM HERE: http://prize-claim.example/a
MIRROR: http://prize-claim.example/b
BACKUP: http://prize-claim.example/c
OR HERE: http://prize-claim.example/d
FAST LINK: http://prize-claim.example/e
GIFT CARD: http://prize-claim.example/f
BONUS: http://prize-claim.example/g
VERIFY: http://prize-claim.example/h
CLAIM AGAIN: http://prize-claim.example/i
LAST CHANCE: http://prize-claim.example/j
UNSUBSCRIBE: http://prize-claim.example/k
TERMS: http://prize-claim.example/l
SUPPORT: http://prize-claim.example/m
MORE: http://prize-claim.example/n`;

export const NORMAL_MAIL = `Subject: Tomorrow's class

Nasib,

Tomorrow's class will be in room 204, same time as before; the
projector in our old room is still broken and nobody has come to
fix it, so we are borrowing the big room upstairs until the end of
the month, and this week's practice sheet is on the class page, here:
http://university.example/sheet-3

Bring last week's notes, and if you get a chance before the
morning, remind the rest of the group about the reading.

Thanks,
Samin`;

export const countFree = (t: string) => (t.match(/\bfree\b/gi) ?? []).length;
export const countLinks = (t: string) => (t.match(/https?:\/\/|www\./gi) ?? []).length;
/** share of the letters that are capitals — the machine's stand-in for shouting */
export const capsShare = (t: string) => {
  const letters = t.match(/[A-Za-z]/g) ?? [];
  if (!letters.length) return 0;
  return letters.filter((c) => c >= "A" && c <= "Z").length / letters.length;
};
