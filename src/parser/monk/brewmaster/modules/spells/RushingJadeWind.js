import React from 'react';

import SPELLS from 'common/SPELLS';
import SpellLink from 'common/SpellLink';
import { formatPercentage } from 'common/format';
import Analyzer from 'parser/core/Analyzer';
import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';

// the buff events all use this spell
export const RUSHING_JADE_WIND_BUFF = SPELLS.RUSHING_JADE_WIND_TALENT_BREWMASTER;

class RushingJadeWind extends Analyzer {
  get uptimeThreshold() {
    if(!this.active) {
      return null;
    }

    return {
      actual: this.uptime,
      isLessThan: {
        minor: 0.85,
        average: 0.75,
        major: 0.65,
      },
      style: 'percentage',
    };
  }

  constructor(...args) {
    super(...args);
    this.active = this.selectedCombatant.hasTalent(SPELLS.RUSHING_JADE_WIND_TALENT_BREWMASTER.id);
  }

  get uptime() {
    return this.selectedCombatant.getBuffUptime(RUSHING_JADE_WIND_BUFF.id) / this.owner.fightDuration;
  }

  // using a suggestion rather than a checklist item for this as RJW is
  // purely offensive
  suggestions(when) {
    when(this.uptimeThreshold)
      .addSuggestion((suggest, actual, recommended) => suggest(<>You had low uptime on <SpellLink id={SPELLS.RUSHING_JADE_WIND.id} />. Try to maintain 100% uptime by refreshing the buff before it drops.</>)
          .icon(SPELLS.RUSHING_JADE_WIND.icon)
          .actual(i18n._(t('monk.brewmaster.suggestions.rushingJadeWind.uptime')`${formatPercentage(actual)}% uptime`))
          .recommended(`${Math.round(formatPercentage(recommended))}% is recommended`));
  }
}

export default RushingJadeWind;
