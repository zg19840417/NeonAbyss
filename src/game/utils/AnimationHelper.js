export default class AnimationHelper {
  static tweenFadeIn(scene, targets, duration = 300, delay = 0, onComplete = null) {
    if (!Array.isArray(targets)) targets = [targets];
    targets.forEach((target, index) => {
      if (!target) return;
      target.setAlpha(0);
      scene.tweens.add({
        targets: target,
        alpha: 1,
        duration: duration,
        delay: delay + index * 50,
        ease: 'Power2',
        onComplete: index === 0 ? onComplete : null
      });
    });
  }

  static tweenFadeOut(scene, targets, duration = 200, delay = 0, onComplete = null) {
    if (!Array.isArray(targets)) targets = [targets];
    targets.forEach((target, index) => {
      if (!target) return;
      scene.tweens.add({
        targets: target,
        alpha: 0,
        duration: duration,
        delay: delay + index * 30,
        ease: 'Power2',
        onComplete: index === targets.length - 1 ? onComplete : null
      });
    });
  }

  static tweenScaleIn(scene, target, duration = 300, delay = 0, onComplete = null) {
    if (!target) return;
    target.setScale(0.5);
    target.setAlpha(0);
    scene.tweens.add({
      targets: target,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: duration,
      delay: delay,
      ease: 'Back.easeOut',
      onComplete: onComplete
    });
  }

  static tweenScaleOut(scene, target, duration = 200, delay = 0, onComplete = null) {
    if (!target) return;
    scene.tweens.add({
      targets: target,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0,
      duration: duration,
      delay: delay,
      ease: 'Back.easeIn',
      onComplete: onComplete
    });
  }

  static tweenSlideIn(scene, target, fromX = 0, fromY = 50, duration = 300, delay = 0, onComplete = null) {
    if (!target) return;
    const originalX = target.x;
    const originalY = target.y;
    target.x = originalX + fromX;
    target.y = originalY + fromY;
    target.setAlpha(0);
    scene.tweens.add({
      targets: target,
      x: originalX,
      y: originalY,
      alpha: 1,
      duration: duration,
      delay: delay,
      ease: 'Power2',
      onComplete: onComplete
    });
  }

  static tweenSlideOut(scene, target, toX = 0, toY = -50, duration = 200, delay = 0, onComplete = null) {
    if (!target) return;
    const originalX = target.x;
    const originalY = target.y;
    scene.tweens.add({
      targets: target,
      x: originalX + toX,
      y: originalY + toY,
      alpha: 0,
      duration: duration,
      delay: delay,
      ease: 'Power2',
      onComplete: () => {
        target.x = originalX;
        target.y = originalY;
        if (onComplete) onComplete();
      }
    });
  }

  static tweenBounceIn(scene, target, duration = 400, delay = 0, onComplete = null) {
    if (!target) return;
    target.setScale(0);
    target.setAlpha(0);
    scene.tweens.add({
      targets: target,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: duration,
      delay: delay,
      ease: 'Elastic.easeOut',
      onComplete: onComplete
    });
  }

  static tweenPulse(scene, target, scale = 1.1, duration = 150, onComplete = null) {
    if (!target) return;
    scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      duration: duration,
      yoyo: true,
      repeat: 0,
      ease: 'Power2',
      onComplete: () => {
        target.setScale(1);
        if (onComplete) onComplete();
      }
    });
  }

  static tweenShake(scene, target, intensity = 5, duration = 200) {
    if (!target) return;
    const originalX = target.x;
    scene.tweens.add({
      targets: target,
      x: originalX + intensity,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Power2',
      onComplete: () => {
        target.x = originalX;
      }
    });
  }

  static tweenButtonPress(scene, target, onComplete = null) {
    if (!target) return;
    const originalScaleX = target.scaleX || 1;
    const originalScaleY = target.scaleY || 1;
    scene.tweens.add({
      targets: target,
      scaleX: originalScaleX * 0.9,
      scaleY: originalScaleY * 0.9,
      duration: 80,
      yoyo: true,
      repeat: 0,
      ease: 'Power2',
      onComplete: onComplete
    });
  }

  static tweenCardHover(scene, target, isHovering) {
    if (!target) return;
    const targetScale = isHovering ? 1.05 : 1;
    scene.tweens.add({
      targets: target,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 150,
      ease: 'Power2'
    });
  }

  static tweenStaggerIn(scene, targets, config = {}) {
    const {
      y = 30,
      duration = 300,
      stagger = 80,
      delay = 0,
      ease = 'Power2',
      onComplete = null
    } = config;

    if (!Array.isArray(targets)) targets = [targets];
    targets.forEach((target, index) => {
      if (!target) return;
      const originalY = target.y;
      target.y = originalY + y;
      target.setAlpha(0);
      scene.tweens.add({
        targets: target,
        y: originalY,
        alpha: 1,
        duration: duration,
        delay: delay + index * stagger,
        ease: ease,
        onComplete: index === targets.length - 1 ? onComplete : null
      });
    });
  }
}
