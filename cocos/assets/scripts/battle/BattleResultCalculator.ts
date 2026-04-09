export interface BattleSettlementPreview {
  win: boolean;
  star: 0 | 1 | 2 | 3;
  noAllyDeath: boolean;
  withinRoundLimit: boolean;
}

export function calculateBattleSettlement(params: {
  win: boolean;
  rounds: number;
  allyDeaths: number;
  roundLimit: number;
}): BattleSettlementPreview {
  if (!params.win) {
    return {
      win: false,
      star: 0,
      noAllyDeath: params.allyDeaths <= 0,
      withinRoundLimit: params.rounds <= params.roundLimit,
    };
  }

  const noAllyDeath = params.allyDeaths <= 0;
  const withinRoundLimit = params.rounds <= params.roundLimit;
  let star: 1 | 2 | 3 = 1;

  if (noAllyDeath) {
    star = 2;
  }
  if (noAllyDeath && withinRoundLimit) {
    star = 3;
  }

  return {
    win: true,
    star,
    noAllyDeath,
    withinRoundLimit,
  };
}
