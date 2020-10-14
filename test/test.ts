import * as TimeRate from '../src';

TimeRate.init({ key: 'heartbeat', ratePer: 'minute', mode: 'rolling', windowLength: 1, windowUnit: 'minute' });

setInterval(() => {
    TimeRate.register('heartbeat');
    console.log(`Heart is beating at ${TimeRate.rate('heartbeat')} beats per minute.`);
}, 333);
