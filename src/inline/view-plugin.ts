import { editorLivePreviewField } from "obsidian";
import { Decoration, MatchDecorator, ViewPlugin, WidgetType } from "@codemirror/view";
import type { DecorationSet, EditorView, PluginSpec, PluginValue, ViewUpdate } from "@codemirror/view";

import type { GithubLinkPlugin } from "../plugin";
import { createTag } from "./inline";

interface DecoSpec {
	widget?: InlineTagWidget;
}

class InlineTagWidget extends WidgetType {
	public error = false;
	private container: HTMLElement = createSpan();
	constructor(
		public readonly href: string,
		dispatch: () => void,
	) {
		super();
		createTag(href)
			.then((tag) => {
				this.container.appendChild(tag);
			})
			.catch((err) => {
				console.error(err);
				this.error = true;
				dispatch(); // Force an update of decorations
			});
	}

	eq(widget: WidgetType): boolean {
		return (widget as InlineTagWidget).href === this.href;
	}

	toDOM(): HTMLElement {
		return this.container;
	}
}

export function createInlineViewPlugin(_plugin: GithubLinkPlugin) {
	class InlineViewPluginValue implements PluginValue {
		public readonly view: EditorView;
		private readonly match = new MatchDecorator({
			regexp: /(https:\/\/)?github\.com[\S]+/g,
			decorate: (add, from, to, match, view) => {
				const shouldRender = this.shouldRender(view, from, to);
				if (shouldRender) {
					add(
						from,
						to,
						Decoration.replace({
							widget: new InlineTagWidget(match[0], view.dispatch),
						}),
					);
				}
			},
		});
		decorations: DecorationSet = Decoration.none;
		constructor(view: EditorView) {
			this.view = view;
			this.updateDecorations(view);
		}

		update(update: ViewUpdate): void {
			this.updateDecorations(update.view, update);
		}

		destroy(): void {
			this.decorations = Decoration.none;
		}

		updateDecorations(view: EditorView, update?: ViewUpdate) {
			if (!update || this.decorations.size === 0) {
				this.decorations = this.match.createDeco(view);
			} else {
				this.decorations = this.match.updateDeco(update, this.decorations);
			}
		}

		isLivePreview(state: EditorView["state"]): boolean {
			return state.field(editorLivePreviewField);
		}

		shouldRender(view: EditorView, decorationFrom: number, decorationTo: number) {
			const overlap = view.state.selection.ranges.some((r) => {
				if (r.from <= decorationFrom) {
					return r.to >= decorationFrom;
				} else {
					return r.from <= decorationTo;
				}
			});
			return !overlap && this.isLivePreview(view.state);
		}
	}

	const InlineViewPluginSpec: PluginSpec<InlineViewPluginValue> = {
		decorations: (plugin) => {
			// Update and return decorations for the CodeMirror view

			return plugin.decorations.update({
				filter: (rangeFrom, rangeTo, deco) => {
					const widget = (deco.spec as DecoSpec).widget;
					if (widget && widget.error) {
						return false;
					}
					// Check if the range is collapsed (cursor position)
					return (
						rangeFrom === rangeTo ||
						// Check if there are no overlapping selection ranges
						!plugin.view.state.selection.ranges.filter((selectionRange) => {
							// Determine the start and end positions of the selection range
							const selectionStart = selectionRange.from;
							const selectionEnd = selectionRange.to;

							// Check if the selection range overlaps with the specified range
							if (selectionStart <= rangeFrom) {
								return selectionEnd >= rangeFrom; // Overlapping condition
							} else {
								return selectionStart <= rangeTo; // Overlapping condition
							}
						}).length
					);
				},
			});
		},
	};

	return ViewPlugin.fromClass(InlineViewPluginValue, InlineViewPluginSpec);
}
