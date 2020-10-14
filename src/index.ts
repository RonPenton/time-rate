import { DateTime, Duration, DurationObject, DurationUnit as LuxonDurationUnit } from 'luxon';

export type Mode = "rolling" | "discrete";

export type DurationUnit = LuxonDurationUnit;

type RollingEvent = DateTime;
// TODO: Eventually use a deque
type RollingEvents = RollingEvent[];

export interface Options {
    key: string;
    mode?: Mode;
    ratePer?: DurationUnit;
    windowLength?: number;
    windowUnit?: DurationUnit;
}

interface DiscreteData {
    start: DateTime;
    events: number;
    lastRate: number;
}

const optionMap = new Map<string, Required<Options>>();
const discreteMap = new Map<string, DiscreteData>();
const rollingMap = new Map<string, RollingEvents>();

const init = (options: Options) => {
    const opts = {
        mode: "discrete",
        ratePer: "second",
        windowLength: 10,
        windowUnit: "seconds",
        ...options
    } as const;

    optionMap.set(options.key, opts);
    if (opts.mode == "rolling") {
        rollingMap.set(opts.key, []);
    }
    else {
        discreteMap.set(opts.key, { start: DateTime.utc(), events: 0, lastRate: 0 });
    }
}

const get = <T>(map: Map<string, T>, key: string) => {
    const item = map.get(key);
    if (!item)
        throw new Error(`Missing options for key: ${key}`);
    return item;
}

const register = (key: string) => {
    const now = DateTime.utc();
    const opts = get(optionMap, key);
    const window = getWindowDuration(opts);

    if (opts.mode == "rolling") {
        calculateRolling(key, now, window, 1);
    }
    else if (opts.mode == "discrete") {
        calculateDiscrete(key, now, window, 1);
    }
}

const calculateRolling = (key: string, now: DateTime, window: Duration, event: 1 | 0): RollingEvents => {
    const cutoff = now.minus(window);
    const rolling = get(rollingMap, key);
    while (rolling.length > 0 && rolling[0] < cutoff) {
        rolling.shift();
    }
    if (event == 1)
        rolling.push(now);

    return rolling;
}

const calculateDiscrete = (key: string, now: DateTime, window: Duration, event: 1 | 0): DiscreteData => {
    const discrete = get(discreteMap, key);
    const cutoff = discrete.start.plus(window);
    if (now < cutoff) {
        // still in window, add event to current window.
        discrete.events += event;
        return discrete;
    }

    const diff = now.diff(cutoff);
    if (diff < window) {
        // new window started.
        const newDiscrete: DiscreteData = {
            start: discrete.start.plus(window),
            events: event,
            lastRate: discrete.events
        };
        discreteMap.set(key, newDiscrete);
        return newDiscrete;
    }

    // more than one window has passed. Rather than try to 
    // recalculate a new start time based on the old bounaries, 
    // just start fresh.
    const newDiscrete: DiscreteData = {
        start: now,
        events: event,
        lastRate: 0
    };
    discreteMap.set(key, newDiscrete);
    return newDiscrete;
}

const getWindowDuration = (opts: Required<Options>) => {
    return getDuration(opts.windowLength, opts.windowUnit);
}

const getDuration = (scalar: number, unit: DurationUnit): Duration => {
    let dur: DurationObject = {};
    dur[unit] = scalar;
    return Duration.fromObject(dur);
}

const rate = (key: string): number => {
    const now = DateTime.utc();
    const opts = get(optionMap, key);
    const window = getWindowDuration(opts);

    const events = opts.mode == "rolling" ?
        calculateRolling(key, now, window, 0).length :
        calculateDiscrete(key, now, window, 0).lastRate;

    const rateWindow = getDuration(1, opts.ratePer).as('milliseconds');
    const ratio = rateWindow / window.as('milliseconds');
    return events * ratio;
}


export {
    init,
    register,
    rate
}
