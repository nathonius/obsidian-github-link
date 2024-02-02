export function titleCase(value: string): string {
	const words = value.split(/[-_]/);
	return words.map((w) => w.charAt(0)?.toUpperCase() + w.slice(1)).join(" ");
}

export function valueWithin(value: number, min: number, max: number) {
	return value >= min && value <= max;
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
