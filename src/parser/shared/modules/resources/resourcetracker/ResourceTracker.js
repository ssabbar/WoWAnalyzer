import Analyzer, { SELECTED_PLAYER } from 'parser/core/Analyzer';
import EventEmitter from 'parser/core/modules/EventEmitter';
import Events, { EventType } from 'parser/core/Events';

/**
 * This is an 'abstract' implementation of a framework for tracking resource generating/spending.
 * Extend it by following the instructions in the TODO comments below
 */
class ResourceTracker extends Analyzer {
  static dependencies = {
    eventEmitter: EventEmitter,
    // Optional dependency for the `resourceCost` prop of events
    // spellResourceCost: SpellResourceCost,
  };

  current = 0;
  resourceUpdates = [];

  // stores resource gained/spent/wasted by ability ID
  buildersObj = {};
  spendersObj = {};

  // TODO set this to the resource you wish to track constructor.. see the appropriate objects in game/RESOURCE_TYPES
  resource;

  // TODO a classes 'main' resource passes the max along with events, but for other resources this may need to be defined
  maxResource;

  constructor(options){
    super(options);
    this.addEventListener(Events.energize.to(SELECTED_PLAYER), this.onEnergize);
    this.addEventListener(Events.cast.by(SELECTED_PLAYER), this.onCast);
  }

  // FIXME implement natural regen
  // TODO if the tracked resource naturally regenerates (like Energy), set this to true and set the parameters of the regeneration in the below fields
  // naturallyRegenerates = false;
  // baseRegenRate; // TODO resource's base regeneration rate in points per second
  // isRegenHasted; // TODO iff true, regeneration rate will be scaled with haste

  // TODO if you wish an ability to show in results even if it wasn't used, add it using these functions constructor
  initBuilderAbility(spellId) {
    this.buildersObj[spellId] = { generated: 0, wasted: 0, casts: 0 };
  }
  initSpenderAbility(spellId) {
    this.spendersObj[spellId] = { spent: 0, spentByCast: [], casts: 0 };
  }

  // BUILDERS - Handled on energize, using the 'resourceChange' field
  onEnergize(event) {
    const spellId = event.ability.guid;

    if(event.resourceChangeType !== this.resource.id) {
        return;
    }

    const waste = event.waste;
    const gain = event.resourceChange - waste;
    this._applyBuilder(spellId, this.getResource(event), gain, waste, event.timestamp);
  }

  // FIXME Track resource drains too, so that the 'current' value can be more accurate

  // TODO if a resource gain isn't showing as an energize in events, handle it manually by calling this
  /**
   * FIXME solve with a normalizer instead?
   * Applies an energize of the tracked resource type.
   * @param {number} spellId - The spellId to attribute the resource gain to
   * @param {number} amount - The raw amount of resources to gain
   */
  processInvisibleEnergize(spellId, amount) {
    const maxGain = this.maxResource !== undefined ? this.maxResource - this.current : amount;
    const gain = Math.min(amount, maxGain);
    const waste = Math.max(amount - maxGain, 0);
    this._applyBuilder(spellId, null, gain, waste);
  }

  _applyBuilder(spellId, resource, gain, waste, timestamp) {
    if (!this.buildersObj[spellId]) {
        this.initBuilderAbility(spellId);
    }

    this.buildersObj[spellId].wasted += waste;
    this.buildersObj[spellId].generated += gain;
    this.buildersObj[spellId].casts += 1;

    // resource.amount for an energize is the amount AFTER the energize
    if (resource !== null && resource !== undefined && resource.amount !== undefined) {
      this.current = resource.amount;
      if (resource.max !== undefined) {
        this.maxResource = resource.max; // track changes in max resource, which can happen due to procs / casts
      }
    } else {
      this.current += gain;
    }

    this.resourceUpdates.push({
      timestamp: timestamp,
      current: this.current,
      waste: waste,
      generated: gain,
      used: 0,
    });
  }

  // SPENDERS - Handled on cast, using the 'classResources' field
  onCast(event) {
    const spellId = event.ability.guid;

    if(!this.shouldProcessCastEvent(event)) {
        return;
    }
    const eventResource = this.getResource(event);
    if (eventResource && eventResource.max) {
      this.maxResource = eventResource.max; // track changes in max resource, which can happen due to procs / casts
    }
    const cost = this.getReducedCost(event);

    if (!this.spendersObj[spellId]) {
      this.initSpenderAbility(spellId);
    }

    if (!cost || cost === 0) {
      return;
    }

    this.spendersObj[spellId].casts += 1;
    this.spendersObj[spellId].spentByCast.push(cost);
    if(cost > 0) {
      this.spendersObj[spellId].spent += cost;
    }

    //Re-sync current amount, to update not-tracked gains.
    this.current = eventResource.amount - cost;

    this.resourceUpdates.push({
      timestamp: event.timestamp,
      current: this.current,
      waste: 0,
      generated: 0,
      used: eventResource.amount,
    });

    this.triggerSpendEvent(cost, event);
  }

  // TODO if your spec has an ability cost reduction that doesn't show in events, handle it manually by overriding here. Or extend SpellResourceCost and apply the discount there.
  getReducedCost(event) {
    if (event.resourceCost && event.resourceCost[this.resource.id] !== undefined) {
      return event.resourceCost[this.resource.id];
    }
    return this.getResource(event).cost;
  }

  getResource(event) {
    if(!event.classResources) {
      return null;
    } else {
      return event.classResources.find(r=>r.type === this.resource.id);
    }
  }

  triggerSpendEvent(spent, event) {
    this.eventEmitter.fabricateEvent({
      type: EventType.SpendResource,
      timestamp: event.timestamp,
      sourceID: event.sourceID,
      targetID: event.targetID,
      resourceChange: spent,
      resourceChangeType: this.resource.id,
      ability: event.ability,
    }, event);
  }

  shouldProcessCastEvent(event) {
    return Boolean(this.getResource(event));
  }

  getGeneratedBySpell(spellId) {
    return (this.buildersObj[spellId] && this.buildersObj[spellId].generated) || 0;
  }

  getWastedBySpell(spellId) {
    return (this.buildersObj[spellId] && this.buildersObj[spellId].wasted) || 0;
  }

  getBuilderCastsBySpell(spellId) {
    return (this.buildersObj[spellId] && this.buildersObj[spellId].casts) || 0;
  }

  get generated() {
    return Object.values(this.buildersObj).reduce((acc, spell) => acc + spell.generated, 0);
  }

  get wasted() {
    return Object.values(this.buildersObj).reduce((acc, spell) => acc + spell.wasted, 0);
  }

  get spent() {
    return Object.values(this.spendersObj).reduce((acc, spell) => acc + spell.spent, 0);
  }

  get spendersCasts() {
    return Object.values(this.spendersObj).reduce((acc, spell) => acc + spell.casts, 0);
  }
}

export default ResourceTracker;
