import Phaser from 'phaser';

class EventBusClass extends Phaser.Events.EventEmitter {
  constructor() {
    super();
  }
}

const EventBus = new EventBusClass();

export { EventBus };
export default EventBus;
