import type { ProspectStatus } from '../../state/prospects';

export type DialogueEffect =
  | { readonly type: 'setStatus'; readonly status: ProspectStatus; readonly notes?: string }
  | { readonly type: 'end' };

export type DialogueCondition =
  | { readonly type: 'statusIs'; readonly status: ProspectStatus }
  | { readonly type: 'statusIsNot'; readonly status: ProspectStatus }
  | { readonly type: 'statusIn'; readonly statuses: ReadonlyArray<ProspectStatus> };

export interface DialogueOption {
  readonly label: string;
  readonly next?: string;
  readonly effects?: ReadonlyArray<DialogueEffect>;
  readonly showIf?: DialogueCondition;
}

export interface DialogueNode {
  readonly id: string;
  readonly speaker?: 'npc' | 'player' | 'narrator';
  readonly text: string;
  readonly options: ReadonlyArray<DialogueOption>;
  readonly entryEffects?: ReadonlyArray<DialogueEffect>;
}

export interface DialogueGraph {
  readonly id: string;
  readonly rootId: string;
  readonly nodes: Readonly<Record<string, DialogueNode>>;
  readonly resumeRules?: ReadonlyArray<DialogueResumeRule>;
}

export interface DialogueResumeRule {
  readonly when: DialogueCondition;
  readonly nodeId: string;
}
