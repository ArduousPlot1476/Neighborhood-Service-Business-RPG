import type { DialogueGraph } from '../../systems/dialogue/dialogueTypes';

const jerryPorter: DialogueGraph = {
  id: 'jerry_porter',
  rootId: 'opener',
  resumeRules: [
    { when: { type: 'statusIs', status: 'qualified' }, nodeId: 'already_qualified' },
    { when: { type: 'statusIs', status: 'disqualified' }, nodeId: 'already_disqualified' },
    { when: { type: 'statusIs', status: 'deferred' }, nodeId: 'already_deferred' },
  ],
  nodes: {
    opener: {
      id: 'opener',
      speaker: 'npc',
      text: "Honestly? The lawn has been getting ahead of me for weeks. If somebody reliable showed up, I'd say yes on the spot.",
      options: [
        { label: "What kind of schedule are you thinking?", next: 'schedule' },
        { label: "I can quote you weekly mow-and-edge today.", next: 'pitch_weekly' },
        { label: "I'm just introducing myself for now.", next: 'soft_exit' },
      ],
    },
    schedule: {
      id: 'schedule',
      speaker: 'npc',
      text: "Every other Saturday, ideally. I work from home so noise before nine is rough. Budget's not the issue — finding someone who shows up is.",
      options: [
        { label: "I do biweekly Saturdays starting at ten. $55 a visit.", next: 'close_qualified' },
        { label: "Saturdays are tough for me. Could we do Fridays?", next: 'wrong_day' },
        { label: "Let me think about scheduling and circle back.", next: 'defer' },
      ],
    },
    pitch_weekly: {
      id: 'pitch_weekly',
      speaker: 'npc',
      text: "Weekly's overkill in spring — you'd be sitting on dead grass half the time. I want someone who tells me that, not someone who upsells me.",
      options: [
        { label: "Fair. Biweekly's the right call here.", next: 'schedule' },
        { label: "Weekly's still what most lawns need.", next: 'pushy_lose' },
        { label: "Sorry, I'll let you get back to your day.", next: 'soft_exit' },
      ],
    },
    wrong_day: {
      id: 'wrong_day',
      speaker: 'npc',
      text: "Fridays I've got the kids. Saturday morning is the whole reason I haven't hired anyone yet.",
      options: [
        { label: "Then Saturdays it is. Start at ten, $55 a visit.", next: 'close_qualified' },
        { label: "Let me see what I can shift and come back.", next: 'defer' },
      ],
    },
    pushy_lose: {
      id: 'pushy_lose',
      speaker: 'npc',
      text: "Yeah, that's not the conversation I wanted to have. Good luck on the rest of the block.",
      options: [
        {
          label: "[ Leave ]",
          effects: [
            { type: 'setStatus', status: 'disqualified', notes: 'Lost trust by overselling weekly service.' },
            { type: 'end' },
          ],
        },
      ],
    },
    close_qualified: {
      id: 'close_qualified',
      speaker: 'npc',
      text: "Sold. Put me on the route — I'll have the side gate unlocked Saturday morning.",
      options: [
        {
          label: "[ Shake on it ]",
          effects: [
            { type: 'setStatus', status: 'qualified', notes: 'Biweekly Saturdays, $55. Side gate unlocked.' },
            { type: 'end' },
          ],
        },
      ],
    },
    defer: {
      id: 'defer',
      speaker: 'npc',
      text: "Sure, take your time. I'm not going anywhere.",
      options: [
        {
          label: "[ Step away ]",
          effects: [
            { type: 'setStatus', status: 'deferred', notes: 'Wants Saturdays — confirm route capacity first.' },
            { type: 'end' },
          ],
        },
      ],
    },
    soft_exit: {
      id: 'soft_exit',
      speaker: 'npc',
      text: "Appreciate that. Stop back when you're working a real route.",
      options: [{ label: "[ Wave and go ]", effects: [{ type: 'end' }] }],
    },
    already_qualified: {
      id: 'already_qualified',
      speaker: 'npc',
      text: "Saturday at ten — I've already cleared the gate. We're good.",
      options: [{ label: "[ Wave and go ]", effects: [{ type: 'end' }] }],
    },
    already_disqualified: {
      id: 'already_disqualified',
      speaker: 'npc',
      text: "I think we said what we needed to say. Take care.",
      options: [{ label: "[ Move on ]", effects: [{ type: 'end' }] }],
    },
    already_deferred: {
      id: 'already_deferred',
      speaker: 'npc',
      text: "Still mulling it. Come back when you've sorted your schedule.",
      options: [
        { label: "Saturdays will work. Lock me in for $55 biweekly.", next: 'close_qualified' },
        { label: "Still working on it — soon.", effects: [{ type: 'end' }] },
      ],
    },
  },
};

const lindaRuiz: DialogueGraph = {
  id: 'linda_ruiz',
  rootId: 'opener',
  resumeRules: [
    { when: { type: 'statusIs', status: 'qualified' }, nodeId: 'already_qualified' },
    { when: { type: 'statusIs', status: 'disqualified' }, nodeId: 'already_disqualified' },
    { when: { type: 'statusIs', status: 'deferred' }, nodeId: 'already_deferred' },
  ],
  nodes: {
    opener: {
      id: 'opener',
      speaker: 'npc',
      text: "Lovely morning. The flower beds out back could use attention — not that I expect miracles on a first visit.",
      options: [
        { label: "Tell me about the beds.", next: 'beds' },
        { label: "I can have a crew here Monday.", next: 'too_fast' },
        { label: "Just saying hi today.", next: 'soft_exit' },
      ],
    },
    beds: {
      id: 'beds',
      speaker: 'npc',
      text: "Two long borders, mostly perennials. My husband always handled them but his back's been giving him trouble. I'd want to talk it over with him before signing anything.",
      options: [
        { label: "That makes sense. I'll come back after you've talked.", next: 'defer_respectful' },
        { label: "I can give you a flat seasonal price right now.", next: 'too_fast' },
        { label: "Let me leave you a card and circle back.", next: 'defer_respectful' },
      ],
    },
    too_fast: {
      id: 'too_fast',
      speaker: 'npc',
      text: "Goodness — I appreciate the energy, but I'd rather not be rushed. We'll take our own time deciding, thank you.",
      options: [
        { label: "Understood — apologies. I'll let you be.", next: 'soft_exit' },
        { label: "It's a simple yes or no.", next: 'pushy_lose' },
      ],
    },
    pushy_lose: {
      id: 'pushy_lose',
      speaker: 'npc',
      text: "Then it's a no. Have a good morning.",
      options: [
        {
          label: "[ Leave ]",
          effects: [
            { type: 'setStatus', status: 'disqualified', notes: 'Pressured her on a first visit. Door is closed.' },
            { type: 'end' },
          ],
        },
      ],
    },
    defer_respectful: {
      id: 'defer_respectful',
      speaker: 'npc',
      text: "Thank you for understanding. Try us again next week — I'll have an answer by then.",
      options: [
        {
          label: "[ Tip cap and go ]",
          effects: [
            { type: 'setStatus', status: 'deferred', notes: 'Spouse decision pending — revisit next week.' },
            { type: 'end' },
          ],
        },
      ],
    },
    soft_exit: {
      id: 'soft_exit',
      speaker: 'npc',
      text: "Take care, dear.",
      options: [{ label: "[ Wave and go ]", effects: [{ type: 'end' }] }],
    },
    already_qualified: {
      id: 'already_qualified',
      speaker: 'npc',
      text: "We're all set for the bed work. See you on the agreed day.",
      options: [{ label: "[ Wave and go ]", effects: [{ type: 'end' }] }],
    },
    already_disqualified: {
      id: 'already_disqualified',
      speaker: 'npc',
      text: "I think I was clear. Good day.",
      options: [{ label: "[ Move on ]", effects: [{ type: 'end' }] }],
    },
    already_deferred: {
      id: 'already_deferred',
      speaker: 'npc',
      text: "We talked it over. The answer's yes — flat seasonal rate, like you suggested.",
      options: [
        {
          label: "Wonderful. Let's lock that in.",
          effects: [
            { type: 'setStatus', status: 'qualified', notes: 'Seasonal bed maintenance accepted on follow-up.' },
            { type: 'end' },
          ],
        },
        { label: "Glad to hear it — I'll write it up next visit.", effects: [{ type: 'end' }] },
      ],
    },
  },
};

const marcusWebb: DialogueGraph = {
  id: 'marcus_webb',
  rootId: 'opener',
  resumeRules: [
    { when: { type: 'statusIs', status: 'qualified' }, nodeId: 'already_qualified' },
    { when: { type: 'statusIs', status: 'disqualified' }, nodeId: 'already_disqualified' },
    { when: { type: 'statusIs', status: 'deferred' }, nodeId: 'already_deferred' },
  ],
  nodes: {
    opener: {
      id: 'opener',
      speaker: 'npc',
      text: "Quick question — you handle hedges, or just lawns? I do not have time to read a flyer. Give me the short version.",
      options: [
        { label: "Hedges and lawn. Flat $90 a month.", next: 'numbers' },
        { label: "Let me walk you through everything we offer.", next: 'too_long' },
        { label: "I'll come back when you have more time.", next: 'soft_exit' },
      ],
    },
    numbers: {
      id: 'numbers',
      speaker: 'npc',
      text: "Ninety, hm. IronRoot quoted me one-twenty for the same thing and they were already annoying. What's the catch?",
      options: [
        { label: "No catch. Solo operator, lower overhead.", next: 'close_path' },
        { label: "I'll match whatever they offered minus ten.", next: 'too_eager' },
        { label: "Honestly, ninety's tight. Let me think.", next: 'defer_path' },
      ],
    },
    too_long: {
      id: 'too_long',
      speaker: 'npc',
      text: "Stop. I asked for the short version. This is exactly why I haven't hired anyone yet.",
      options: [
        { label: "Sorry — hedges and lawn, $90 flat.", next: 'numbers' },
        { label: "If you'd just listen for a minute —", next: 'pushy_lose' },
      ],
    },
    pushy_lose: {
      id: 'pushy_lose',
      speaker: 'npc',
      text: "We're done. Close the gate on your way out.",
      options: [
        {
          label: "[ Leave ]",
          effects: [
            { type: 'setStatus', status: 'disqualified', notes: 'Talked over him. Hard no.' },
            { type: 'end' },
          ],
        },
      ],
    },
    too_eager: {
      id: 'too_eager',
      speaker: 'npc',
      text: "If you'll undercut on the spot you'll undercut yourself out of business. Pass.",
      options: [
        {
          label: "[ Leave ]",
          effects: [
            { type: 'setStatus', status: 'disqualified', notes: 'Discounted reflexively — read as desperate.' },
            { type: 'end' },
          ],
        },
      ],
    },
    close_path: {
      id: 'close_path',
      speaker: 'npc',
      text: "Fine. Start next week. Don't make me regret it.",
      options: [
        {
          label: "[ Confirm ]",
          effects: [
            { type: 'setStatus', status: 'qualified', notes: 'Hedges + lawn, $90/mo flat. Start next week.' },
            { type: 'end' },
          ],
        },
      ],
    },
    defer_path: {
      id: 'defer_path',
      speaker: 'npc',
      text: "Then come back with a real number. I'm not chasing you.",
      options: [
        {
          label: "[ Step away ]",
          effects: [
            { type: 'setStatus', status: 'deferred', notes: 'Need a tighter price before he commits.' },
            { type: 'end' },
          ],
        },
      ],
    },
    soft_exit: {
      id: 'soft_exit',
      speaker: 'npc',
      text: "Don't make a habit of it.",
      options: [{ label: "[ Walk off ]", effects: [{ type: 'end' }] }],
    },
    already_qualified: {
      id: 'already_qualified',
      speaker: 'npc',
      text: "We're booked. Don't waste my time confirming twice.",
      options: [{ label: "[ Walk off ]", effects: [{ type: 'end' }] }],
    },
    already_disqualified: {
      id: 'already_disqualified',
      speaker: 'npc',
      text: "Off my property.",
      options: [{ label: "[ Move on ]", effects: [{ type: 'end' }] }],
    },
    already_deferred: {
      id: 'already_deferred',
      speaker: 'npc',
      text: "You back with a real number?",
      options: [
        {
          label: "Yes — $90 flat, hedges and lawn.",
          effects: [
            { type: 'setStatus', status: 'qualified', notes: 'Closed on follow-up at the same number.' },
            { type: 'end' },
          ],
        },
        { label: "Still working on it.", effects: [{ type: 'end' }] },
      ],
    },
  },
};

const patHaller: DialogueGraph = {
  id: 'pat_haller',
  rootId: 'opener',
  nodes: {
    opener: {
      id: 'opener',
      speaker: 'npc',
      text: "Welcome to Sycamore Ridge. Two blocks of steady work here if you read the street right and do not oversell.",
      options: [
        { label: "Who on the street is actually looking?", next: 'tips' },
        { label: "Any neighbors I should avoid?", next: 'warning' },
        { label: "I'm trying to sign you up too — what do you need?", next: 'not_a_prospect' },
      ],
    },
    tips: {
      id: 'tips',
      speaker: 'npc',
      text: "Jerry across the way is dying for help. Linda and her husband move slow but they're loyal once they decide. Marcus — be brief or don't bother.",
      options: [
        { label: "Appreciated. I owe you one.", next: 'farewell' },
        { label: "Sure I can't pitch you a service?", next: 'not_a_prospect' },
      ],
    },
    warning: {
      id: 'warning',
      speaker: 'npc',
      text: "Watch for IronRoot trucks. They've been blanketing flyers and they don't take kindly to a small crew working their target blocks.",
      options: [
        { label: "Good to know. Thanks, Pat.", next: 'farewell' },
        { label: "Sure I can't pitch you a service?", next: 'not_a_prospect' },
      ],
    },
    not_a_prospect: {
      id: 'not_a_prospect',
      speaker: 'npc',
      text: "I do my own yard — always have. I'm just the welcome wagon. Save the pitch for someone who wants it.",
      options: [{ label: "Fair enough. Thanks for the intel.", next: 'farewell' }],
    },
    farewell: {
      id: 'farewell',
      speaker: 'npc',
      text: "Go on then. Knock on the right doors.",
      options: [{ label: "[ Wave and go ]", effects: [{ type: 'end' }] }],
    },
  },
};

const GRAPHS: Readonly<Record<string, DialogueGraph>> = {
  jerry_porter: jerryPorter,
  linda_ruiz: lindaRuiz,
  marcus_webb: marcusWebb,
  pat_haller: patHaller,
} as const;

export function getDialogueGraph(id: string): DialogueGraph | undefined {
  return GRAPHS[id];
}

export function listDialogueGraphIds(): ReadonlyArray<string> {
  return Object.keys(GRAPHS);
}
