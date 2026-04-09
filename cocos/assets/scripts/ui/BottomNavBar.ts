import { _decorator, Component } from 'cc';
import { SceneNames, SceneNavigator } from '../core';
import { CommonButton } from './CommonButton';

const { ccclass, property } = _decorator;

export type BottomNavTab = 'shelter' | 'team' | 'map' | 'shop' | 'settings';

@ccclass('BottomNavBar')
export class BottomNavBar extends Component {
  @property(CommonButton)
  public shelterButton: CommonButton | null = null;

  @property(CommonButton)
  public teamButton: CommonButton | null = null;

  @property(CommonButton)
  public mapButton: CommonButton | null = null;

  @property(CommonButton)
  public shopButton: CommonButton | null = null;

  @property(CommonButton)
  public settingsButton: CommonButton | null = null;

  public onLoad(): void {
    this.shelterButton?.setClickHandler(() => void SceneNavigator.goTo(SceneNames.Shelter));
    this.teamButton?.setClickHandler(() => void SceneNavigator.goTo(SceneNames.Team));
    this.mapButton?.setClickHandler(() => void SceneNavigator.goTo(SceneNames.Map));
    this.shopButton?.setClickHandler(() => void SceneNavigator.goTo(SceneNames.Shop));
    this.settingsButton?.setClickHandler(() => void SceneNavigator.goTo(SceneNames.Settings));
  }

  public setActiveTab(tab: BottomNavTab): void {
    const all: Array<[BottomNavTab, CommonButton | null]> = [
      ['shelter', this.shelterButton],
      ['team', this.teamButton],
      ['map', this.mapButton],
      ['shop', this.shopButton],
      ['settings', this.settingsButton],
    ];

    all.forEach(([key, button]) => {
      button?.setSelected(key === tab);
    });
  }
}
