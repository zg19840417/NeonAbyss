import FusionGirlManager from './FusionGirlManager.js';
import { fusionGirls } from '../data/FusionGirlData.js';

export function syncFusionGirlProgress(gameData = window.gameData || {}) {
  const manager = FusionGirlManager.fromJSON(gameData.fusionGirlManager || {});
  const clearedStages = Array.isArray(gameData.progress?.clearedStages) ? gameData.progress.clearedStages : [];
  const clearedStageSet = new Set(clearedStages);

  fusionGirls.forEach((girlConfig) => {
    const unlockStageId = girlConfig.unlockStageId || null;
    const summonUnlockStageId = girlConfig.summonUnlockStageId || girlConfig.unlockStageId || null;

    if (girlConfig.isStarter) {
      manager.unlockGirl(girlConfig.id, { unlockSummon: !!girlConfig.isStarterSummonUnlocked });
      return;
    }

    if (unlockStageId && clearedStageSet.has(unlockStageId)) {
      manager.unlockGirl(girlConfig.id, { unlockSummon: false });
    }

    if (summonUnlockStageId && clearedStageSet.has(summonUnlockStageId)) {
      manager.unlockGirl(girlConfig.id, { unlockSummon: true });
    }
  });

  gameData.fusionGirlManager = manager.toJSON();
  return manager;
}
