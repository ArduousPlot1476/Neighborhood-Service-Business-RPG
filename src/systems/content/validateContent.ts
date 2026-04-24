import type { ProspectSeed } from '../../content/prospects/starterDistrictProspects';
import { deriveArchetypeId, getArchetype } from '../../content/closing/customerArchetypes';
import { listServicePlans, getServicePlan } from '../../content/services/servicePlans';
import { listYardLayouts } from '../../content/jobs/starterJobs';
import { listDisruptionEvents } from '../../content/events/disruptionEvents';
import type { DialogueGraph } from '../dialogue/dialogueTypes';
import type { NpcData } from '../../types';
import type { AccountPlan } from '../../state/accounts';

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

  for (const plan of listServicePlans()) {
    try {
      const fetched = getServicePlan(plan.id as AccountPlan);
      if (fetched.cadenceDays <= 0) {
        errors.push(`Service plan "${plan.id}" has non-positive cadenceDays (${plan.cadenceDays}).`);
      }
      if (fetched.basePayoutCents <= 0) {
        errors.push(`Service plan "${plan.id}" has non-positive basePayoutCents.`);
      }
      if (fetched.defaultZoneCount <= 0) {
        errors.push(`Service plan "${plan.id}" has non-positive defaultZoneCount.`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`Service plan "${plan.id}" failed lookup: ${message}`);
    }
  }

  const yardSeen = new Set<string>();
  for (const layout of listYardLayouts()) {
    if (!npcIds.has(layout.npcId)) {
      errors.push(`Yard layout for "${layout.npcId}" has no matching NPC placement.`);
    }
    if (yardSeen.has(layout.npcId)) {
      errors.push(`Duplicate yard layout for "${layout.npcId}".`);
    }
    yardSeen.add(layout.npcId);
    if (layout.zones.length === 0) {
      errors.push(`Yard layout "${layout.npcId}" defines no zones.`);
    }
    for (const zone of layout.zones) {
      if (zone.secondsToService <= 0) {
        errors.push(`Yard layout "${layout.npcId}" zone "${zone.id}" has non-positive secondsToService.`);
      }
    }
  }

  const eventIds = new Set<string>();
  for (const event of listDisruptionEvents()) {
    if (eventIds.has(event.id)) {
      errors.push(`Duplicate disruption event id "${event.id}".`);
    }
    eventIds.add(event.id);
    if (event.deadlineDays <= 0) {
      errors.push(`Disruption event "${event.id}" has non-positive deadlineDays.`);
    }
    if (event.initialSatisfactionPenalty < 0) {
      errors.push(`Disruption event "${event.id}" has negative initialSatisfactionPenalty (use a non-negative magnitude).`);
    }
    if (event.resolveOnJobQuality.length === 0) {
      errors.push(`Disruption event "${event.id}" has no resolveOnJobQuality entries — it can never resolve via service.`);
    }
  }

  if (errors.length > 0) {
    throw new ContentValidationError(
      `Content validation failed:\n  - ${errors.join('\n  - ')}`,
    );
  }
}
