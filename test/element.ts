/**
 * Local version of obsidian's 'createEl' function, copied from
 * https://ryotaushio.github.io/the-hobbyist-dev/obsidian/api-&-internals/createel.html
 */
function createEl<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	options?: string | DomElementInfo,
	callback?: (el: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	if (typeof options === "string") options = { cls: options };
	options = options || {};

	if (options.cls) Array.isArray(options.cls) ? (el.className = options.cls.join(" ")) : (el.className = options.cls);
	if (options.text) el.setText(options.text);
	if (options.attr) {
		for (const [k, v] of Object.entries(options.attr)) {
			el.setAttribute(k, String(v));
		}
	}
	if (options.title !== undefined) el.title = options.title;
	if (
		options.value !== undefined &&
		(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLOptionElement)
	) {
		el.value = options.value;
	}
	if (options.type && el instanceof HTMLInputElement) el.type = options.type;
	if (options.type && el instanceof HTMLStyleElement) el.setAttribute("type", options.type);
	if (options.placeholder && el instanceof HTMLInputElement) el.placeholder = options.placeholder;
	if (
		options.href &&
		(el instanceof HTMLAnchorElement || el instanceof HTMLLinkElement || el instanceof HTMLBaseElement)
	)
		el.href = options.href;
	callback?.(el);
	if (options.parent) {
		if (options.prepend) options.parent.insertBefore(el, options.parent.firstChild);
		else options.parent.appendChild(el);
	}
	// add event listeners (e.g. { onclick: () => {} })
	for (const key in options) {
		if (Object.prototype.hasOwnProperty.call(options, key) && key.startsWith("on")) {
			const value = options[key as keyof DomElementInfo];
			if (typeof value === "function") el.addEventListener(key.substring(2), value);
		}
	}
	return el;
}

function createSpan(options?: string | DomElementInfo, callback?: (el: HTMLSpanElement) => void) {
	return createEl("span", options, callback);
}

function createDiv(options?: string | DomElementInfo, callback?: (el: HTMLDivElement) => void) {
	return createEl("div", options, callback);
}

export function elementTestSetup() {
	HTMLElement.prototype.setText = function (text: string) {
		this.innerText = text;
	};
	window.createEl = createEl;
	window.createSpan = createSpan;
	window.createDiv = createDiv;
}
