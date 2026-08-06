// jsdom doesn't expose structuredClone, but fake-indexeddb needs it
if (typeof globalThis.structuredClone === "undefined") {
	globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}
