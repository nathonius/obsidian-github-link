export type RemoveIndexSignature<T> = {
	[K in keyof T as string extends K ? never : number extends K ? never : symbol extends K ? never : K]: T[K];
};

export enum LogLevel {
	Error = 0,
	Warn = 1,
	Info = 2,
	Debug = 3,
}

export function verboseFactory(logLevel: LogLevel) {
	const log = (message: unknown, level: LogLevel) => {
		if (level <= logLevel) {
			switch (level) {
				case LogLevel.Error:
					console.error(message);
					break;
				case LogLevel.Warn:
					console.warn(message);
					break;
				case LogLevel.Info:
					console.info(message);
					break;
				case LogLevel.Debug:
					console.debug(message);
					break;
			}
		}
	};
	return {
		log,
		error: (message: unknown) => log(message, LogLevel.Error),
		warn: (message: unknown) => log(message, LogLevel.Warn),
		info: (message: unknown) => log(message, LogLevel.Info),
		debug: (message: unknown) => log(message, LogLevel.Debug),
	};
}

export function titleCase(value: string): string {
	const words = value.split(/[-_]/);
	return words.map((w) => w.charAt(0)?.toUpperCase() + w.slice(1)).join(" ");
}

export function valueWithin(value: number, min: number, max: number) {
	return value >= min && value <= max;
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
export function getProp<T extends { [key: string]: unknown }>(value: T, prop: string): unknown | null {
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
		parsed = JSON.parse(value);
	} catch (err) {
		return null;
	}

	// Validate object shape
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const result: any = {};
	for (const [_prop, include] of Object.entries(props)) {
		const prop = _prop as keyof T;
		if (include && parsed[prop as keyof T]) {
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

export class RequestError implements Error {
	name: string;
	message: string;
	stack?: string | undefined;
	headers: Record<string, string>;
	status: number;
	constructor(public readonly originalError: Error) {
		// Base error props
		this.name = originalError.name;
		this.stack = originalError.stack;
		this.message = originalError.message;

		// Request props
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.headers = (originalError as any).headers;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.status = (originalError as any).status;
	}
}
