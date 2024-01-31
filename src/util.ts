export function valueWithin(value: number, min: number, max: number) {
	return value >= min && value <= max;
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
