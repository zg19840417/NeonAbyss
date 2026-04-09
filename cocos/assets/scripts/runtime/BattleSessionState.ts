export interface PendingBattleSession {
  stageId: string;
  chapterId: string;
  stageName: string;
  starRoundLimit: number;
  enemyGroupId: string;
}

export class BattleSessionState {
  private pendingBattle: PendingBattleSession | null = null;

  public setPendingBattle(session: PendingBattleSession): void {
    this.pendingBattle = session;
  }

  public getPendingBattle(): PendingBattleSession | null {
    return this.pendingBattle;
  }

  public clearPendingBattle(): void {
    this.pendingBattle = null;
  }
}
