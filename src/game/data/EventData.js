import eventsData from '../../../assets/data/json/events.json';
import eventPoolsData from '../../../assets/data/json/eventPools.json';

class EventData {
  constructor() {
    this._events = {};
    this._pools = {};
    this._load();
  }

  _load() {
    if (Array.isArray(eventsData)) {
      eventsData.forEach(e => { this._events[e.eventId] = e; });
    }
    if (Array.isArray(eventPoolsData)) {
      eventPoolsData.forEach(p => { this._pools[p.poolId] = p; });
    }
  }

  getEventById(eventId) {
    return this._events[eventId] || null;
  }

  getPoolById(poolId) {
    return this._pools[poolId] || null;
  }

  // 从事件池中加权随机抽取一个事件
  rollEventFromPool(poolId) {
    const pool = this._pools[poolId];
    if (!pool || !pool.events || pool.events.length === 0) return null;

    // 过滤weight>0的事件
    const active = pool.events.filter(e => e.weight > 0);
    if (active.length === 0) return null;

    // 加权随机
    const totalWeight = active.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of active) {
      roll -= entry.weight;
      if (roll <= 0) {
        return this._events[entry.eventId] || null;
      }
    }
    return this._events[active[active.length - 1].eventId] || null;
  }
}

export default new EventData();
