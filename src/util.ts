import { isEqual as lodashIsEqual } from "lodash";

export type RemoveIndexSignature<T> = {
	[K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};

/**
 * Small wrapper around lodash isEqual to tell typescript to stop complaining about its any types
 */
export function isEqual<T, R>(value: T, other: R): boolean {
	return lodashIsEqual(value, other);
}

export function titleCase(value: string): string {
	const words = value.split(/[-_]/);
	return words.map((w) => w.charAt(0)?.toUpperCase() + w.slice(1)).join(" ");
}

export function valueWithin(value: number, min: number, max: number) {
	return value >= min && value <= max;
}

export function assertDefined<T>(value: T | undefined | null): asserts value is T {
	if (value === undefined || value === null) {
		throw new Error(`Expected value to be defined!`);
	}
}

type SourceToTargetFunction<T, R, K extends keyof R> = (value: T) => R[K];
type SourceToTarget<T, R, K extends keyof R> = K extends keyof T
	? T[K] extends R[K]
		? true | SourceToTargetFunction<T, R, K>
		: SourceToTargetFunction<T, R, K>
	: SourceToTargetFunction<T, R, K>;
type ObjectMapConfig<T, R> = { [K in keyof R]: SourceToTarget<T, R, K> };

/**
 * Create an object of type R from source object of type T
 * @param config An object describing how to map the values from the source to the new object.
 *                Using true for a key passes the value from the source object as-is (if possible),
 *                while a function will be called to transform the property. Config must include
 *                every non-optional key on the target object type.
 */
export function mapObject<T, R>(
	value: T,
	config: ObjectMapConfig<T, R>,
	removeUndefined = false,
	removeNull = false,
): R {
	const resultEntries: [string, unknown][] = [];

	for (const entry of Object.entries(config)) {
		const key = entry[0];
		const configSet = entry[1] as SourceToTarget<T, R, keyof R>;

		if (configSet === true) {
			resultEntries.push([key, value[key as keyof T]]);
		} else {
			resultEntries.push([key, configSet(value)]);
		}
	}

	let finalEntries: [string, unknown][] = [];
	if (removeUndefined || removeNull) {
		for (const [key, value] of resultEntries) {
			if ((removeUndefined && value === undefined) || (removeNull && value === null)) {
				continue;
			}
			finalEntries.push([key, value]);
		}
	} else {
		finalEntries = [...resultEntries];
	}

	return Object.fromEntries(finalEntries) as R;
}

export function sanitizeObject<T>(params: T, usableFieldMap: Record<keyof T, boolean>): T {
	const usableFields: (keyof T)[] = Object.entries(usableFieldMap)
		.filter(([_, value]) => value)
		.map(([key, _]) => key as keyof T);

	const result: T = {} as T;
	for (const field of usableFields) {
		if (params[field] !== undefined) {
			result[field] = params[field];
		}
	}

	return result;
}

/**
 * Attempts to handle getting a nested property using a string of js object notation
 */
export function getProp<T extends { [key: string]: unknown }>(value: T, prop: string): unknown {
	if (!prop.includes(".")) {
		return value[prop] ?? null;
	}

	const parts = prop.split(".");
	let val: T = value;
	for (const part of parts) {
		try {
			val = val[part] as T;
		} catch (err) {
			return null;
		}
	}

	return val ?? null;
}

export function safeJSONParse<T>(value: string, props: Record<keyof T, boolean>): T | null {
	// Handle parsing with try / catch
	let parsed: T;
	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		parsed = JSON.parse(value);
	} catch (err) {
		return null;
	}

	// Validate object shape
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result: any = {};
	for (const [_prop, include] of Object.entries(props)) {
		const prop = _prop as keyof T;
		if (include && parsed[prop]) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			result[prop] = parsed[prop];
		}
	}

	return result as T;
}

// Reference for more formats: https://github.com/moment/luxon/blob/master/src/impl/formats.js
const n = "numeric";
// eslint-disable-next-line unused-imports/no-unused-vars
const s = "short";
// eslint-disable-next-line unused-imports/no-unused-vars
const l = "long";

export const DateFormat = {
	DATE_SHORT: new Intl.DateTimeFormat(undefined, {
		year: n,
		month: n,
		day: n,
	}),
};

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Implementation of Promise.withResolvers.
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
 */
export function promiseWithResolvers<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let reject!: (reason?: any) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { resolve, reject, promise };
}

export function isSuccessResponse(code: number) {
	return code >= 200 && code <= 208;
}

export class RequestError implements Error {
	name: string;
	message: string;
	stack?: string;
	headers: Record<string, string>;
	status: number;
	constructor(public readonly originalError: Error) {
		// Base error props
		this.name = originalError.name;
		this.stack = originalError.stack;
		this.message = originalError.message;

		// Request props
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		this.headers = (originalError as any).headers;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		this.status = (originalError as any).status;
	}
}
