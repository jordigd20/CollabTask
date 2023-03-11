import { AnimationController } from '@ionic/angular';

export const toastEnterAnimation = (
  baseEl: any,
  position: string,
  animationController: AnimationController
) => {
  const baseAnimation = animationController.create();
  const wrapperAnimation = animationController.create();
  const iconAnimation = animationController.create();

  const root = baseEl.shadowRoot;
  const wrapperEl = root.querySelector('.toast-wrapper') as HTMLElement;
  const iconEl = root.querySelector('.toast-icon') as HTMLElement;
  const toastContent = root.querySelector('.toast-content') as HTMLElement;
  toastContent.style.setProperty('padding', '10px 12px');

  const bottom = `calc(8px + var(--ion-safe-area-bottom, 0px))`;
  const top = `calc(8px + var(--ion-safe-area-top, 0px))`;

  wrapperAnimation.addElement(wrapperEl).fromTo('transform', 'translateY(0)', 'translateY(-100%)');

  switch (position) {
    case 'top':
      wrapperEl.style.top = top;
      wrapperAnimation.fromTo('opacity', 0.01, 1);
      break;
    case 'middle':
      const topPosition = Math.floor(baseEl.clientHeight / 2 - wrapperEl.clientHeight / 2);
      wrapperEl.style.top = `${topPosition}px`;
      wrapperAnimation.fromTo('opacity', 0.01, 1);
      break;
    default:
      wrapperEl.style.bottom = bottom;
      wrapperAnimation.fromTo('opacity', 0.01, 1);
      break;
  }

  iconAnimation
    .addElement(iconEl)
    .delay(200)
    .duration(500)
    .fromTo('opacity', 0.01, 1)
    .fromTo('transform', 'scale3d(0.3, 0.3, 0.3)', 'scale3d(1, 1, 1)');

  return baseAnimation
    .easing('cubic-bezier(.36,.66,.04,1)')
    .duration(400)
    .addAnimation([wrapperAnimation, iconAnimation]);
};

export const toastleaveAnimation = (baseEl: any, animationController: AnimationController) => {
  const baseAnimation = animationController.create();
  const wrapperAnimation = animationController.create();

  const root = baseEl.shadowRoot;
  const wrapperEl = root.querySelector('.toast-wrapper') as HTMLElement;

  wrapperAnimation
    .addElement(wrapperEl)
    .fromTo('opacity', 0.99, 0)
    .fromTo('transform', 'translate3d(0, -100%, 0)', 'translate3d(0, 100%, 0)');

  return baseAnimation
    .easing('cubic-bezier(.36,.66,.04,1)')
    .duration(500)
    .addAnimation(wrapperAnimation);
};
