# time-rate

A simple library to measure time rates. Uses Luxon under the hood.

## Usage

Simplest case, defaults to 10-second windows, returns numbers in rate per second.

```ts
import * as TimeRate from 'time-rate';

TimeRate.init({ key: 'heartbeat' });

setInterval(() => {
    TimeRate.register('heartbeat');
    console.log(`Heart is beating at ${TimeRate.rate('heartbeat')} beats per second.`);
}, 500);
```

Or you can customize it:

```ts
import * as TimeRate from 'time-rate';

TimeRate.init({ key: 'heartbeat', ratePer: 'minute', windowLength: 1, windowUnit: 'minute' });

setInterval(() => {
    TimeRate.register('heartbeat');
    console.log(`Heart is beating at ${TimeRate.rate('heartbeat')} beats per minute.`);
}, 2000);
```

## Discrete Mode

Defaults to discrete mode. This is faster and uses less memory. Keeps track of the number of events per window. However your rate results will not be instantaneous, you will get the rate for the previous window. Keep windows smaller if you want more up-to-date results. 

```ts
import * as TimeRate from 'time-rate';

TimeRate.init({ key: 'heartbeat', ratePer: 'minute', mode: 'discrete', windowLength: 10, windowUnit: 'seconds' });

setInterval(() => {
    TimeRate.register('heartbeat');
    console.log(`Heart is beating at ${TimeRate.rate('heartbeat')} beats per minute.`);
}, 2000);
```

## Rolling Mode

This keeps track of every event that has fired during the specified window. Erases events once they are past the window. Gives the most accurate value, but at the cost of storage space and speed. 

```ts
import * as TimeRate from 'time-rate';

TimeRate.init({ key: 'heartbeat', ratePer: 'minute', mode: 'rolling', windowLength: 1, windowUnit: 'minute' });

setInterval(() => {
    TimeRate.register('heartbeat');
    console.log(`Heart is beating at ${TimeRate.rate('heartbeat')} beats per minute.`);
}, 2000);
```

If you register 50,000 events per minute and your window is 1 minute, then an array of 50,000 dates is allocated. Use this mode only if you know you're okay with that tradeoff.
