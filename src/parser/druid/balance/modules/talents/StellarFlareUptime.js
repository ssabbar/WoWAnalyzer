import React from 'react';

import Analyzer from 'parser/core/Analyzer';
import Enemies from 'parser/shared/modules/Enemies';

import SpellLink from 'common/SpellLink';
import SPELLS from 'common/SPELLS';
import SpellIcon from 'common/SpellIcon';
import { formatPercentage } from 'common/format';
import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';

import StatisticBox, { STATISTIC_ORDER } from 'interface/others/StatisticBox';

class StellarFlareUptime extends Analyzer {
  static dependencies = {
    enemies: Enemies,
  };

  constructor(...args) {
    super(...args);
    this.active = this.selectedCombatant.hasTalent(SPELLS.STELLAR_FLARE_TALENT.id);
  }

  get suggestionThresholds() {
    const stellarFlareUptime = this.enemies.getBuffUptime(SPELLS.STELLAR_FLARE_TALENT.id) / this.owner.fightDuration;
    return {
      actual: stellarFlareUptime,
      isLessThan: {
        minor: 0.95,
        average: 0.9,
        major: 0.8,
      },
      style: 'percentage',
    };
  }

  suggestions(when) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) => suggest(<>Your <SpellLink id={SPELLS.STELLAR_FLARE_TALENT.id} /> uptime can be improved. Try to pay more attention to your Stellar Flare on the boss.</>)
        .icon(SPELLS.STELLAR_FLARE_TALENT.icon)
        .actual(i18n._(t('druid.balance.suggestions.stellarFlare.uptime')`${formatPercentage(actual)}% Stellar Flare uptime`))
        .recommended(`>${formatPercentage(recommended)}% is recommended`));
  }

  statistic() {
    const stellarFlareUptime = this.enemies.getBuffUptime(SPELLS.STELLAR_FLARE_TALENT.id) / this.owner.fightDuration;
    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.STELLAR_FLARE_TALENT.id} />}
        value={`${formatPercentage(stellarFlareUptime)} %`}
        label="Stellar Flare uptime"
      />
    );
  }

  statisticOrder = STATISTIC_ORDER.OPTIONAL();
}

export default StellarFlareUptime;
