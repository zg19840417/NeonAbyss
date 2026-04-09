import type { AppContext } from './AppContext';

export class AppSession {
  private static context: AppContext | null = null;

  public static hasContext(): boolean {
    return Boolean(AppSession.context);
  }

  public static setContext(context: AppContext): void {
    AppSession.context = context;
  }

  public static getContext(): AppContext {
    if (!AppSession.context) {
      throw new Error('AppContext has not been initialized.');
    }
    return AppSession.context;
  }

  public static clear(): void {
    AppSession.context = null;
  }
}
