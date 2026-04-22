import type { GameState } from '../../state/GameState';
import type { ProspectStatus } from '../../state/prospects';
import type {
  DialogueCondition,
  DialogueEffect,
  DialogueGraph,
  DialogueNode,
  DialogueOption,
} from './dialogueTypes';

export interface DialogueViewModel {
  readonly speakerName: string;
  readonly speakerRole: string;
  readonly speaker: 'npc' | 'player' | 'narrator';
  readonly text: string;
  readonly options: ReadonlyArray<DialogueOptionViewModel>;
  readonly statusLabel: string;
  readonly status: ProspectStatus;
}

export interface DialogueOptionViewModel {
  readonly index: number;
  readonly label: string;
}

export interface DialogueSession {
  readonly npcId: string;
  readonly npcName: string;
  readonly npcRole: string;
  readonly graph: DialogueGraph;
}

export type DialogueEndReason = 'completed' | 'cancelled';

export type DialogueEndCallback = (reason: DialogueEndReason, npcId: string) => void;

export class DialogueController {
  private session: DialogueSession | null = null;
  private currentNodeId: string | null = null;
  private endCallback: DialogueEndCallback | null = null;

  constructor(private readonly state: GameState) {}

  start(session: DialogueSession): DialogueViewModel {
    this.state.registerProspect(session.npcId);
    this.session = session;
    this.currentNodeId = this.resolveStartingNodeId(session);
    this.applyEntryEffects();
    return this.viewModel();
  }

  isOpen(): boolean {
    return this.session !== null;
  }

  currentNpcId(): string | null {
    return this.session?.npcId ?? null;
  }

  view(): DialogueViewModel | null {
    if (!this.session || !this.currentNodeId) return null;
    return this.viewModel();
  }

  selectOption(index: number): DialogueViewModel | null {
    if (!this.session || !this.currentNodeId) return null;
    const node = this.session.graph.nodes[this.currentNodeId];
    if (!node) {
      this.finish('completed');
      return null;
    }
    const visible = this.visibleOptions(node);
    if (index < 0 || index >= visible.length) return this.viewModel();
    const choice = visible[index]!;
    return this.applyChoice(choice);
  }

  cancel(): void {
    if (!this.session) return;
    this.finish('cancelled');
  }

  onEnd(callback: DialogueEndCallback): void {
    this.endCallback = callback;
  }

  private viewModel(): DialogueViewModel {
    const session = this.session!;
    const node = session.graph.nodes[this.currentNodeId!]!;
    const visible = this.visibleOptions(node);
    const status = this.state.getProspectStatus(session.npcId);
    return {
      speakerName: session.npcName,
      speakerRole: session.npcRole,
      speaker: node.speaker ?? 'npc',
      text: node.text,
      options: visible.map((opt, i) => ({ index: i, label: opt.label })),
      statusLabel: this.statusLabel(status),
      status,
    };
  }

  private statusLabel(status: ProspectStatus): string {
    switch (status) {
      case 'qualified':
        return 'Qualified';
      case 'deferred':
        return 'Follow up later';
      case 'disqualified':
        return 'Not a fit';
      default:
        return 'Unknown';
    }
  }

  private applyChoice(option: DialogueOption): DialogueViewModel | null {
    const effects = option.effects ?? [];
    let endRequested = false;
    for (const effect of effects) {
      if (this.applyEffect(effect)) endRequested = true;
    }
    if (endRequested) {
      this.finish('completed');
      return null;
    }
    if (option.next) {
      this.currentNodeId = option.next;
      this.applyEntryEffects();
      return this.viewModel();
    }
    this.finish('completed');
    return null;
  }

  private applyEntryEffects(): void {
    if (!this.session || !this.currentNodeId) return;
    const node: DialogueNode | undefined = this.session.graph.nodes[this.currentNodeId];
    if (!node?.entryEffects) return;
    for (const effect of node.entryEffects) {
      this.applyEffect(effect);
    }
  }

  private applyEffect(effect: DialogueEffect): boolean {
    if (!this.session) return false;
    switch (effect.type) {
      case 'setStatus':
        this.state.setProspectStatus(this.session.npcId, effect.status, effect.notes ?? null);
        return false;
      case 'end':
        return true;
      default:
        return false;
    }
  }

  private resolveStartingNodeId(session: DialogueSession): string {
    const status = this.state.getProspectStatus(session.npcId);
    const rules = session.graph.resumeRules ?? [];
    for (const rule of rules) {
      if (this.matches(rule.when, status) && session.graph.nodes[rule.nodeId]) {
        return rule.nodeId;
      }
    }
    return session.graph.rootId;
  }

  private visibleOptions(node: DialogueNode): ReadonlyArray<DialogueOption> {
    const status = this.session ? this.state.getProspectStatus(this.session.npcId) : 'unknown';
    return node.options.filter((opt) => !opt.showIf || this.matches(opt.showIf, status));
  }

  private matches(condition: DialogueCondition, status: ProspectStatus): boolean {
    switch (condition.type) {
      case 'statusIs':
        return status === condition.status;
      case 'statusIsNot':
        return status !== condition.status;
      case 'statusIn':
        return condition.statuses.includes(status);
      default:
        return false;
    }
  }

  private finish(reason: DialogueEndReason): void {
    const npcId = this.session?.npcId;
    this.session = null;
    this.currentNodeId = null;
    if (npcId && this.endCallback) {
      this.endCallback(reason, npcId);
    }
  }
}
