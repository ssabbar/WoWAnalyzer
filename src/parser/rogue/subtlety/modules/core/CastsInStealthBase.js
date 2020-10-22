import React from 'react';
import SPELLS from 'common/SPELLS';
import SpellLink from 'common/SpellLink';
import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';

import Analyzer from 'parser/core/Analyzer';

class CastsInStealthBase extends Analyzer {
  constructor(...args) {
    super(...args);

    this.backstabSpell = this.selectedCombatant.hasTalent(SPELLS.GLOOMBLADE_TALENT.id)
    ? SPELLS.GLOOMBLADE_TALENT
    : SPELLS.BACKSTAB;
    this.badStealthSpells = [this.backstabSpell];
  }
  backstabSpell = null;
  badStealthSpells = [];
  stealthCondition = '';
  maxCastsPerStealth = 0;

  createWrongCastThresholds(spell, tracker) {
    return {
      actual: tracker.getAbility(spell.id).casts,
      isGreaterThan: {
        minor: 0,
        average: 0,
        major: 0,
      },
      style: 'number',
    };
  }

  suggestWrongCast(when, spell, thresholds) {
    when(thresholds)
      .addSuggestion((suggest, actual, recommended) => suggest(<>Use <SpellLink id={SPELLS.SHADOWSTRIKE.id} /> instead of <SpellLink id={spell.id} /> during {this.stealthCondition}. </>)
          .icon(spell.icon)
          .actual(i18n._(t('rogue.subtlety.suggestions.castsInStealth.casts')`${actual} ${spell.name} casts`))
          .recommended(`${recommended} is recommended`));
  }

  validStealthSpellIds = [
    SPELLS.BACKSTAB.id,
    SPELLS.GLOOMBLADE_TALENT.id,
    SPELLS.SHURIKEN_STORM.id,
    SPELLS.SHADOWSTRIKE.id,
    SPELLS.NIGHTBLADE.id,
    SPELLS.EVISCERATE.id,
    SPELLS.SHURIKEN_TORNADO_TALENT.id,
    SPELLS.SECRET_TECHNIQUE_TALENT.id,
  ]

  get stealthMaxCasts() {
    return 0;
  }
  get stealthActualCasts() {
    return 0;
  }

  get castsInStealthThresholds() {
    return {
      actual: this.stealthActualCasts / this.stealthMaxCasts,
      isLessThan: {
        minor: 1,
        average: 0.9,
        major: 0.8,
      },
      style: 'percentage',
    };
  }

  suggestAvgCasts(when, spell) {
    when(this.castsInStealthThresholds)
      .addSuggestion((suggest, actual, recommended) => suggest(<>Try to cast {this.maxCastsPerStealth} spells during {this.stealthCondition}</>)
          .icon(spell.icon)
          .actual(i18n._(t('rogue.subtlety.suggestions.castsInStealth.efficiency')`${this.stealthActualCasts} casts out of ${this.stealthMaxCasts} possible.`))
          .recommended(`${this.maxCastsPerStealth} in each ${this.stealthCondition} window`));
  }
}

export default CastsInStealthBase;
