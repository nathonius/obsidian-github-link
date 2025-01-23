export function setIconMock(parent: HTMLElement, iconId: string): void {
	const icon = document.createElement("span");
	icon.innerText = iconId;
	parent.appendChild(icon);
}
