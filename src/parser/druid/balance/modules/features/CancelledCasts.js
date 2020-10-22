import CoreCancelledCasts from 'parser/shared/modules/CancelledCasts';
import { formatPercentage } from 'common/format';
import { STATISTIC_ORDER } from 'interface/others/StatisticBox';
import { i18n } from '@lingui/core';
import { t } from '@lingui/macro';


class CancelledCasts extends CoreCancelledCasts {
  get suggestionThresholds() {
    return {
      actual: this.castsCancelled / this.totalCasts,
      isGreaterThan: {
        minor: 0.05,
        average: 0.075,
        major: 0.1,
      },
      style: 'percentage',
    };
  }

  suggestions(when) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) => suggest(`You cancelled ${formatPercentage(actual)}% of your spells. While it is expected that you will have to cancel a few casts to react to a boss mechanic or to move, you should try to ensure that you are cancelling as few casts as possible.`)
          .icon('inv_misc_map_01')
          .actual(i18n._(t('druid.balance.suggestions.castsCancelled')`${formatPercentage(actual)}% casts cancelled`))
          .recommended(`<${formatPercentage(recommended)}% is recommended`));
  }

  statisticOrder = STATISTIC_ORDER.CORE(8);
}

export default CancelledCasts;
