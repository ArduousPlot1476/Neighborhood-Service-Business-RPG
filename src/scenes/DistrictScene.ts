import Phaser from 'phaser';
import { TILE_SIZE } from '../game/config';
import { Player } from '../entities/Player';
import { Npc } from '../entities/Npc';
import { PlayerController, type InputKeys } from '../systems/input/PlayerController';
import { InteractionPrompt } from '../systems/interactions/InteractionPrompt';
import { InteractionPanel } from '../systems/interactions/InteractionPanel';
import { StatusToast } from '../systems/interactions/StatusToast';
import { DialogueController } from '../systems/dialogue/DialogueController';
import { getDialogueGraph } from '../content/dialogue/starterDistrictDialogue';
import { starterDistrict } from '../content/districts/starterDistrict';
import { starterDistrictNpcs } from '../content/npcs/starterDistrictNpcs';
import {
  getProspectProfile,
  starterDistrictProspects,
} from '../content/prospects/starterDistrictProspects';
import { deriveArchetypeId, getArchetype } from '../content/closing/customerArchetypes';
import { getServicePlan } from '../content/services/servicePlans';
import { getYardLayout } from '../content/jobs/starterJobs';
import { GameState } from '../state/GameState';
import { PROSPECT_STATUS_LABEL } from '../state/prospects';
import { DEAL_STATUS_COLOR, DEAL_STATUS_LABEL } from '../state/deals';
import {
  ACCOUNT_INITIAL_SATISFACTION,
  ACCOUNT_PLAN_LABEL,
  RISK_BAND_LABEL,
  formatDollars,
  formatMonthlyValue,
  riskBandFromSatisfaction,
  type AccountRecord,
} from '../state/accounts';
import { JOB_STATUS_COLOR, JOB_STATUS_LABEL } from '../state/jobs';
import { DISRUPTION_STATUS_COLOR } from '../state/disruptions';
import { RouteBookOverlay } from '../ui/RouteBookOverlay';
import { DisruptionController } from '../systems/rival/DisruptionController';
import { validateContent } from '../systems/content/validateContent';
import {
  ENCOUNTER_RESULT_EVENT,
  type EncounterCompletionPayload,
  type EncounterSceneData,
} from './ClosingEncounterScene';
import {
  SERVICE_JOB_RESULT_EVENT,
  type ServiceJobCompletionPayload,
  type ServiceJobSceneData,
} from './ServiceJobScene';
import { DAY_CLOSE_DONE_EVENT, type DayCloseAdvanceResult, type DayCloseSceneData } from './DayCloseScene';
import { SOLID_TILE_INDICES, TILESET_KEY } from './PreloadScene';
import { clearSave, readSave, writeSave } from '../state/saveSystem';
import type { SceneState } from '../types';

const INTERACT_RADIUS = TILE_SIZE * 1.4;
const PLAYER_SPEED = 110;

export class DistrictScene extends Phaser.Scene {
  private player!: Player;
  private controller!: PlayerController;
  private keys!: InputKeys;
  private npcs: Npc[] = [];
  private npcsById = new Map<string, Npc>();
  private prompt!: InteractionPrompt;
  private panel!: InteractionPanel;
  private toast!: StatusToast;
  private routeBook!: RouteBookOverlay;
  private gameState!: GameState;
  private dialogue!: DialogueController;
  private disruptions!: DisruptionController;
  private state: SceneState = 'EXPLORING';
  private dayBannerText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DistrictScene' });
  }

  create(): void {
    validateContent({
      npcs: starterDistrictNpcs,
      prospects: starterDistrictProspects,
      lookupDialogue: getDialogueGraph,
    });

    const district = starterDistrict;

    const map = this.make.tilemap({
      data: district.tiles.map((row) => [...row]),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tileset = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tileset) {
      throw new Error('DistrictScene: failed to register tileset image.');
    }
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) {
      throw new Error('DistrictScene: failed to create tile layer.');
    }
    layer.setCollision([...SOLID_TILE_INDICES]);
    layer.setDepth(0);

    const worldWidth = district.width * TILE_SIZE;
    const worldHeight = district.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    const spawnX = district.spawn.tileX * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = district.spawn.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, spawnX, spawnY);
    (this.player.sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.physics.add.collider(this.player.sprite, layer);

    const loadResult = readSave();
    let loadToastMessage: { text: string; color: number } | null = null;
    if (loadResult.status === 'ok') {
      this.gameState = GameState.fromSerialized(loadResult.envelope.payload);
      for (const seed of starterDistrictProspects) {
        if (!this.gameState.getProspect(seed.npcId)) {
          this.gameState.registerProspect(seed.npcId);
        }
      }
      const ageSeconds = Math.round((Date.now() - loadResult.envelope.savedAt) / 1000);
      loadToastMessage = {
        text: `Save loaded — Day ${this.gameState.getCurrentDay()} (${formatRelativeAge(ageSeconds)})`,
        color: 0x6ec27a,
      };
    } else {
      this.gameState = new GameState();
      for (const seed of starterDistrictProspects) {
        this.gameState.registerProspect(seed.npcId);
      }
      if (loadResult.status === 'corrupt' || loadResult.status === 'incompatible') {
        loadToastMessage = {
          text: `Save unreadable (${loadResult.reason}) — starting fresh`,
          color: 0xc25450,
        };
        clearSave();
      }
    }
    this.disruptions = new DisruptionController(this.gameState);

    for (const data of starterDistrictNpcs) {
      const npc = new Npc(this, data);
      this.npcs.push(npc);
      this.npcsById.set(data.id, npc);
      this.physics.add.collider(this.player.sprite, npc.sprite);
      npc.setStatus(this.gameState.getProspectStatus(data.id));
    }

    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, 0.18, 0.18);
    cam.setBounds(0, 0, worldWidth, worldHeight);
    cam.setRoundPixels(true);
    cam.setBackgroundColor(0x0f1a14);

    this.controller = new PlayerController(PLAYER_SPEED);
    this.keys = PlayerController.createKeys(this);

    this.prompt = new InteractionPrompt(this);
    this.panel = new InteractionPanel(this);
    this.toast = new StatusToast(this);
    this.routeBook = new RouteBookOverlay(this, this.gameState);

    this.dialogue = new DialogueController(this.gameState);
    this.dialogue.onEnd(() => {
      this.panel.hide();
      this.state = 'EXPLORING';
    });

    this.gameState.on((change) => {
      switch (change.type) {
        case 'prospectStatusChanged': {
          const npc = this.npcsById.get(change.npcId);
          if (!npc) return;
          npc.setStatus(change.next);
          this.toast.show(npc.data.name, change.next);
          return;
        }
        case 'jobScheduled':
        case 'jobStatusChanged': {
          this.refreshJobMarkers();
          return;
        }
        case 'dayAdvanced': {
          this.refreshJobMarkers();
          this.refreshContestedMarkers();
          this.refreshDayBanner();
          return;
        }
        case 'disruptionTriggered': {
          this.refreshContestedMarkers();
          const account = this.gameState.getAccount(change.disruption.accountId);
          this.toast.showRaw(
            `IronRoot is contesting ${account?.npcName ?? change.disruption.npcId}`,
            DISRUPTION_STATUS_COLOR.active,
          );
          return;
        }
        case 'disruptionStatusChanged': {
          this.refreshContestedMarkers();
          return;
        }
        case 'accountChurned': {
          this.refreshJobMarkers();
          this.refreshContestedMarkers();
          const account = this.gameState.getAccount(change.accountId);
          if (account) {
            this.toast.showRaw(`${account.npcName} churned to IronRoot`, 0x9a9a9a);
          }
          return;
        }
        default:
          return;
      }
    });

    this.dayBannerText = this.add
      .text(4, 4, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#d9c78a',
      })
      .setScrollFactor(0)
      .setDepth(80);

    this.add
      .text(4, 16, 'Move WASD/Arrows  |  Talk E  |  Choose 1-4  |  Leave Esc', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setScrollFactor(0)
      .setDepth(80)
      .setAlpha(0.8);

    this.add
      .text(4, 28, '[Tab] Route Book  |  [N] End Day', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8ab07a',
      })
      .setScrollFactor(0)
      .setDepth(80)
      .setAlpha(0.8);

    this.refreshDayBanner();
    this.refreshJobMarkers();
    this.refreshContestedMarkers();

    if (loadToastMessage) {
      this.time.delayedCall(150, () => {
        this.toast.showRaw(loadToastMessage!.text, loadToastMessage!.color);
      });
    }
  }

  override update(): void {
    const interactJustPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.interact) ||
      Phaser.Input.Keyboard.JustDown(this.keys.altInteract);
    const cancelJustPressed = Phaser.Input.Keyboard.JustDown(this.keys.cancel);
    const tabJustPressed = Phaser.Input.Keyboard.JustDown(this.keys.routeBook);
    const endDayJustPressed = Phaser.Input.Keyboard.JustDown(this.keys.endDay);

    if (this.state === 'ENCOUNTER' || this.state === 'SERVICE_JOB' || this.state === 'DAY_CLOSE') {
      this.controller.update(this.player.sprite, this.keys, true);
      return;
    }

    if (this.state === 'ROUTE_BOOK') {
      this.controller.update(this.player.sprite, this.keys, true);
      if (tabJustPressed || cancelJustPressed) {
        this.routeBook.hide();
        this.state = 'EXPLORING';
        return;
      }
      if (endDayJustPressed) {
        this.routeBook.hide();
        this.openDayClose();
        return;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.save)) {
        this.handleManualSave();
        return;
      }
      if (this.keys.shift.isDown && Phaser.Input.Keyboard.JustDown(this.keys.reset)) {
        this.handleSaveReset();
        return;
      }
      return;
    }

    if (this.state === 'INFO_PANEL') {
      this.controller.update(this.player.sprite, this.keys, true);
      if (interactJustPressed || cancelJustPressed) {
        this.panel.hide();
        this.state = 'EXPLORING';
      }
      return;
    }

    if (this.state === 'DIALOGUE') {
      this.controller.update(this.player.sprite, this.keys, true);

      if (cancelJustPressed) {
        this.dialogue.cancel();
        return;
      }

      const digitIndex = this.firstJustPressedDigit();
      if (digitIndex !== null) {
        this.advanceDialogue(digitIndex);
        return;
      }

      if (interactJustPressed && this.panel.visibleOptionCount === 1) {
        this.advanceDialogue(0);
      }
      return;
    }

    if (tabJustPressed) {
      this.openRouteBook();
      return;
    }

    if (endDayJustPressed) {
      this.openDayClose();
      return;
    }

    const facing = this.controller.update(this.player.sprite, this.keys, false);
    if (facing) {
      this.player.facing = facing;
    }

    const nearest = this.findNearestNpcInRange();
    if (nearest) {
      this.prompt.showAbove(
        nearest.data.id,
        nearest.sprite.x,
        nearest.sprite.y,
        this.promptLabelFor(nearest),
      );
    } else {
      this.prompt.hide();
    }

    if (interactJustPressed && nearest) {
      this.engage(nearest);
    }
  }

  private engage(npc: Npc): void {
    const prospectStatus = this.gameState.getProspectStatus(npc.data.id);
    const dealStatus = this.gameState.getDealStatus(npc.data.id);

    if (prospectStatus === 'qualified' && dealStatus === 'won') {
      const account = this.gameState.getAccountByNpc(npc.data.id);
      if (account?.churned) {
        this.openChurnedPanel(npc, account);
        return;
      }
      const job = this.gameState.getActiveJobForNpc(npc.data.id, this.gameState.getCurrentDay());
      if (job) {
        this.launchServiceJob(npc, job.id);
        return;
      }
      this.openWonAccountPanel(npc);
      return;
    }

    if (prospectStatus === 'qualified' && (dealStatus === 'none' || dealStatus === 'deferred')) {
      this.launchEncounter(npc);
      return;
    }

    if (prospectStatus === 'qualified' && dealStatus === 'lost') {
      this.openLostDealPanel(npc);
      return;
    }

    this.openDialogue(npc);
  }

  private openDialogue(npc: Npc): void {
    const graph = getDialogueGraph(npc.data.dialogueId);
    if (!graph) return;
    this.state = 'DIALOGUE';
    this.prompt.hide();
    const view = this.dialogue.start({
      npcId: npc.data.id,
      npcName: npc.data.name,
      npcRole: npc.data.role,
      graph,
    });
    this.panel.render(view);
  }

  private launchEncounter(npc: Npc): void {
    const profile = getProspectProfile(npc.data.id);
    if (!profile) {
      throw new Error(`launchEncounter: no qualification profile for npcId "${npc.data.id}"`);
    }
    const archetype = getArchetype(deriveArchetypeId(profile));
    const init = {
      npcId: npc.data.id,
      npcName: npc.data.name,
      npcRole: npc.data.role,
      profile,
      archetype,
    };

    this.gameState.setDealStatus(npc.data.id, 'in_progress');
    this.gameState.recordEncounterAttempt(npc.data.id);

    this.state = 'ENCOUNTER';
    this.prompt.hide();

    const encounterScene = this.scene.get('ClosingEncounterScene');
    encounterScene.events.once(ENCOUNTER_RESULT_EVENT, (payload: EncounterCompletionPayload) => {
      this.handleEncounterResult(payload);
    });

    const data: EncounterSceneData = { init };
    this.scene.pause();
    this.scene.launch('ClosingEncounterScene', data);
  }

  private handleEncounterResult(payload: EncounterCompletionPayload): void {
    const { npcId, result } = payload;
    const npc = this.npcsById.get(npcId);

    let nextDealStatus: 'won' | 'lost' | 'deferred';
    let toastMessage: string;
    switch (result.outcome) {
      case 'win':
        nextDealStatus = 'won';
        toastMessage = `${npc?.data.name ?? npcId} — Account opened`;
        break;
      case 'lose':
        nextDealStatus = 'lost';
        toastMessage = `${npc?.data.name ?? npcId} — Deal lost`;
        break;
      case 'defer':
      default:
        nextDealStatus = 'deferred';
        toastMessage = `${npc?.data.name ?? npcId} — Re-pitch later`;
        break;
    }

    this.gameState.setDealStatus(npcId, nextDealStatus, result.summaryLine);

    if (result.outcome === 'win' && npc) {
      const today = this.gameState.getCurrentDay();
      const account: AccountRecord = {
        id: npcId,
        npcId,
        npcName: npc.data.name,
        plan: result.plan,
        monthlyValueCents: result.priceCents,
        openedTick: this.gameState.currentTick(),
        openingNotes: result.summaryLine,
        lastServicedDay: null,
        totalEarnedCents: 0,
        jobsCompleted: 0,
        jobsMissed: 0,
        jobsFailed: 0,
        satisfaction: ACCOUNT_INITIAL_SATISFACTION,
        nextDueDay: today,
        churned: false,
        churnedDay: null,
      };
      this.gameState.openAccount(account);
      this.scheduleFirstJob(account);
    }

    this.scene.resume();
    this.state = 'EXPLORING';

    this.toast.showRaw(toastMessage, this.toastColorFor(nextDealStatus));
  }

  private scheduleFirstJob(account: AccountRecord): void {
    const plan = getServicePlan(account.plan);
    this.gameState.scheduleJob({
      accountId: account.id,
      npcId: account.npcId,
      servicePlanId: plan.id,
      scheduledDay: this.gameState.getCurrentDay(),
      zonesTotal: plan.defaultZoneCount,
    });
  }

  private launchServiceJob(npc: Npc, jobId: string): void {
    const job = this.gameState.startJob(jobId);
    const account = this.gameState.getAccount(job.accountId);
    if (!account) return;
    const plan = getServicePlan(account.plan);
    const layout = getYardLayout(npc.data.id);

    this.state = 'SERVICE_JOB';
    this.prompt.hide();

    const serviceScene = this.scene.get('ServiceJobScene');
    serviceScene.events.once(SERVICE_JOB_RESULT_EVENT, (payload: ServiceJobCompletionPayload) => {
      this.handleServiceJobResult(payload);
    });

    const data: ServiceJobSceneData = {
      init: {
        jobId: job.id,
        accountId: account.id,
        npcId: npc.data.id,
        npcName: npc.data.name,
        servicePlanId: plan.id,
        basePayoutCents: plan.basePayoutCents,
        serviceLabel: plan.serviceLabel,
        layout,
      },
    };
    this.scene.pause();
    this.scene.launch('ServiceJobScene', data);
  }

  private handleServiceJobResult(payload: ServiceJobCompletionPayload): void {
    const { jobId, result } = payload;
    const job = this.gameState.finishJob({
      jobId,
      status: result.outcome,
      qualityScore: result.qualityScore,
      payoutCents: result.payoutCents,
      zonesCleared: result.zonesCleared,
      qualityLabel: result.qualityLabel,
    });

    let resolvedDisruptionMessage: string | null = null;
    if (job.status === 'completed') {
      const resolved = this.disruptions.evaluateOnJobCompletion(job);
      if (resolved) {
        const account = this.gameState.getAccount(resolved.accountId);
        resolvedDisruptionMessage = `${account?.npcName ?? resolved.npcId} kept you — IronRoot rebuffed`;
      }
    }

    this.scene.resume();
    this.state = 'EXPLORING';

    const account = this.gameState.getAccount(job.accountId);
    const accountName = account?.npcName ?? job.npcId;
    const tone = result.outcome === 'completed' ? 0x6ec27a : 0xc25450;
    const message =
      result.outcome === 'completed'
        ? `${accountName} — Job done (${formatDollars(result.payoutCents)})`
        : `${accountName} — Job did not finish`;
    this.toast.showRaw(message, tone);
    if (resolvedDisruptionMessage) {
      this.time.delayedCall(900, () => {
        this.toast.showRaw(resolvedDisruptionMessage!, 0x6ec27a);
      });
    }
  }

  private openRouteBook(): void {
    this.state = 'ROUTE_BOOK';
    this.prompt.hide();
    this.routeBook.show();
  }

  private openDayClose(): void {
    this.state = 'DAY_CLOSE';
    this.routeBook.hide();
    this.prompt.hide();

    const dayCloseScene = this.scene.get('DayCloseScene');
    dayCloseScene.events.once(DAY_CLOSE_DONE_EVENT, () => {
      this.scene.resume();
      this.state = 'EXPLORING';
      this.autoSaveAfterDayClose();
    });

    const data: DayCloseSceneData = {
      state: this.gameState,
      onAdvance: () => this.advanceDay(),
    };
    this.scene.pause();
    this.scene.launch('DayCloseScene', data);
  }

  private handleManualSave(): void {
    const result = writeSave(this.gameState);
    if (result.status === 'ok') {
      this.toast.showRaw('Game saved', 0x6ec27a);
      this.routeBook.refresh();
    } else {
      this.toast.showRaw(`Save failed — ${result.reason}`, 0xc25450);
    }
  }

  private autoSaveAfterDayClose(): void {
    const result = writeSave(this.gameState);
    if (result.status === 'ok') {
      this.toast.showRaw('Auto-saved', 0x6ec27a);
    } else {
      this.toast.showRaw(`Auto-save failed — ${result.reason}`, 0xc25450);
    }
  }

  private handleSaveReset(): void {
    const result = clearSave();
    if (result.status === 'ok') {
      this.toast.showRaw('Save cleared — refresh to start fresh', 0xe6b84a);
      this.routeBook.refresh();
    } else {
      this.toast.showRaw(`Reset failed — ${result.reason}`, 0xc25450);
    }
  }

  private advanceDay(): DayCloseAdvanceResult {
    const summary = this.gameState.closeDay();
    const disruptions = this.disruptions.evaluateOnDayClose({
      closingDay: summary.previousDay,
      nextDay: summary.nextDay,
    });
    return { summary, disruptions };
  }

  private openWonAccountPanel(npc: Npc): void {
    const account = this.gameState.getAccountByNpc(npc.data.id);
    const day = this.gameState.getCurrentDay();
    const lastJob = this.gameState
      .getJobsForNpc(npc.data.id)
      .find((j) => j.scheduledDay === day);
    const disruption = account ? this.gameState.getActiveDisruptionForAccount(account.id) : undefined;
    let body: string;
    let statusLabel: string;
    let statusColor: number;
    if (account) {
      const planLabel = ACCOUNT_PLAN_LABEL[account.plan];
      const value = formatMonthlyValue(account.monthlyValueCents);
      const earned = formatDollars(account.totalEarnedCents);
      const todayLine = lastJob ? JOB_STATUS_LABEL[lastJob.status] : 'No service today';
      const band = riskBandFromSatisfaction(account.satisfaction);
      const bandLabel = RISK_BAND_LABEL[band];
      const dueLine = `Next due day ${account.nextDueDay}`;
      const baseLine = `${planLabel} at ${value}. Earned ${earned}. Health: ${account.satisfaction}/100 (${bandLabel}). ${dueLine}. Today: ${todayLine}.`;
      if (disruption) {
        const remaining = Math.max(0, disruption.deadlineDay - day);
        body = `${disruption.narrative}\nIronRoot deadline: ${remaining} day${remaining === 1 ? '' : 's'}. Win them back with a solid+ service.\n\n${baseLine}`;
        statusLabel = 'Contested';
        statusColor = DISRUPTION_STATUS_COLOR.active;
      } else {
        body = baseLine;
        statusLabel = DEAL_STATUS_LABEL.won;
        statusColor = lastJob ? JOB_STATUS_COLOR[lastJob.status] : DEAL_STATUS_COLOR.won;
      }
    } else {
      body = "We're booked. Just keep showing up.";
      statusLabel = DEAL_STATUS_LABEL.won;
      statusColor = DEAL_STATUS_COLOR.won;
    }
    this.state = 'INFO_PANEL';
    this.prompt.hide();
    this.panel.renderInfo({
      name: npc.data.name,
      role: npc.data.role,
      body,
      statusLabel,
      statusColor,
    });
  }

  private openChurnedPanel(npc: Npc, account: AccountRecord): void {
    const earned = formatDollars(account.totalEarnedCents);
    this.state = 'INFO_PANEL';
    this.prompt.hide();
    this.panel.renderInfo({
      name: npc.data.name,
      role: npc.data.role,
      body: `${npc.data.name} signed with IronRoot. You earned ${earned} on this account before they switched.`,
      statusLabel: 'Lost to IronRoot',
      statusColor: 0x9a9a9a,
    });
  }

  private openLostDealPanel(npc: Npc): void {
    this.state = 'INFO_PANEL';
    this.prompt.hide();
    this.panel.renderInfo({
      name: npc.data.name,
      role: npc.data.role,
      body: "Door's closed on the deal. Move on for now — they may circle back.",
      statusLabel: DEAL_STATUS_LABEL.lost,
      statusColor: DEAL_STATUS_COLOR.lost,
    });
  }

  private advanceDialogue(index: number): void {
    const next = this.dialogue.selectOption(index);
    if (next) {
      this.panel.render(next);
    }
  }

  private firstJustPressedDigit(): number | null {
    for (let i = 0; i < this.keys.digits.length; i += 1) {
      const key = this.keys.digits[i]!;
      if (Phaser.Input.Keyboard.JustDown(key)) {
        return i;
      }
    }
    return null;
  }

  private promptLabelFor(npc: Npc): string {
    const prospect = this.gameState.getProspectStatus(npc.data.id);
    const deal = this.gameState.getDealStatus(npc.data.id);
    if (prospect === 'qualified' && deal === 'won') {
      const account = this.gameState.getAccountByNpc(npc.data.id);
      if (account?.churned) return '[E] Churned';
      if (npc.isContested) return '[E] Win them back';
      return npc.hasJobReady ? '[E] Service yard' : '[E] Booked';
    }
    if (prospect === 'qualified' && (deal === 'none' || deal === 'deferred')) {
      return '[E] Pitch';
    }
    if (prospect === 'qualified' && deal === 'lost') return '[E] Closed';
    if (prospect === 'unknown') return '[E] Talk';
    return `[E] ${PROSPECT_STATUS_LABEL[prospect]}`;
  }

  private toastColorFor(status: 'won' | 'lost' | 'deferred'): number {
    return DEAL_STATUS_COLOR[status];
  }

  private refreshJobMarkers(): void {
    const day = this.gameState.getCurrentDay();
    for (const npc of this.npcs) {
      const account = this.gameState.getAccountByNpc(npc.data.id);
      if (account?.churned) {
        npc.setJobReady(false);
        continue;
      }
      const job = this.gameState.getActiveJobForNpc(npc.data.id, day);
      npc.setJobReady(!!job && job.status === 'scheduled');
    }
  }

  private refreshContestedMarkers(): void {
    for (const npc of this.npcs) {
      const disruption = this.gameState.getActiveDisruptionForNpc(npc.data.id);
      npc.setContested(!!disruption);
    }
  }

  private refreshDayBanner(): void {
    const day = this.gameState.getCurrentDay();
    const districtName = starterDistrict.name;
    this.dayBannerText.setText(`${districtName} — Day ${day}`);
  }

  private findNearestNpcInRange(): Npc | null {
    let best: Npc | null = null;
    let bestDist = INTERACT_RADIUS;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    for (const npc of this.npcs) {
      const dist = Math.hypot(npc.sprite.x - px, npc.sprite.y - py);
      if (dist <= bestDist) {
        best = npc;
        bestDist = dist;
      }
    }
    return best;
  }
}

function formatRelativeAge(seconds: number): string {
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
