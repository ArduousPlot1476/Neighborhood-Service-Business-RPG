import type { ProspectSeed } from '../../content/prospects/starterDistrictProspects';
import { deriveArchetypeId, getArchetype } from '../../content/closing/customerArchetypes';
import type { DialogueGraph } from '../dialogue/dialogueTypes';
import type { NpcData } from '../../types';

export interface ContentValidationInput {
  readonly npcs: ReadonlyArray<NpcData>;
  readonly prospects: ReadonlyArray<ProspectSeed>;
  readonly lookupDialogue: (id: string) => DialogueGraph | undefined;
}

export class ContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

export function validateContent(input: ContentValidationInput): void {
  const errors: string[] = [];

  const profileByNpc = new Map(input.prospects.map((s) => [s.npcId, s.profile]));
  const npcIds = new Set<string>();

  for (const npc of input.npcs) {
    if (npcIds.has(npc.id)) {
      errors.push(`Duplicate NPC id "${npc.id}" in starterDistrictNpcs.`);
    }
    npcIds.add(npc.id);

    const graph = input.lookupDialogue(npc.dialogueId);
    if (!graph) {
      errors.push(`NPC "${npc.id}" references missing dialogueId "${npc.dialogueId}".`);
      continue;
    }
    if (!graph.nodes[graph.rootId]) {
      errors.push(`Dialogue graph "${graph.id}" rootId "${graph.rootId}" is not in nodes.`);
    }
    for (const [nodeId, node] of Object.entries(graph.nodes)) {
      for (const opt of node.options) {
        if (opt.next && !graph.nodes[opt.next]) {
          errors.push(
            `Dialogue graph "${graph.id}": node "${nodeId}" option "${opt.label}" points to missing node "${opt.next}".`,
          );
        }
      }
    }
    for (const rule of graph.resumeRules ?? []) {
      if (!graph.nodes[rule.nodeId]) {
        errors.push(
          `Dialogue graph "${graph.id}": resumeRule points to missing node "${rule.nodeId}".`,
        );
      }
    }

    const profile = profileByNpc.get(npc.id);
    if (!profile) continue;

    try {
      getArchetype(deriveArchetypeId(profile));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`NPC "${npc.id}" profile derives an unknown archetype: ${message}`);
    }
  }

  for (const seed of input.prospects) {
    if (!npcIds.has(seed.npcId)) {
      errors.push(`Prospect seed for "${seed.npcId}" has no matching NPC placement.`);
    }
  }

  if (errors.length > 0) {
    throw new ContentValidationError(
      `Content validation failed:\n  - ${errors.join('\n  - ')}`,
    );
  }
}
