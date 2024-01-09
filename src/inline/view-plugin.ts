import { Component, editorLivePreviewField } from "obsidian";
import { Decoration, MatchDecorator, ViewPlugin, WidgetType } from "@codemirror/view";
import type { DecorationSet, EditorView, PluginSpec, PluginValue, ViewUpdate } from "@codemirror/view";

import type { GithubLinkPlugin } from "../plugin";
import { createTag } from "./inline";

class InlineTagWidget extends WidgetType {
	private container: HTMLElement = createSpan();
	constructor(href: string) {
		super();
		createTag(href).then((tag) => {
			this.container.appendChild(tag);
		});
	}
	toDOM(): HTMLElement {
		return this.container;
	}
}

export function createInlineViewPlugin(plugin: GithubLinkPlugin) {
	class InlineViewPluginValue implements PluginValue {
		public readonly view: EditorView;
		private readonly component = new Component();
		private readonly plugin: GithubLinkPlugin;
		private readonly match = new MatchDecorator({
			regexp: /(https:\/\/)?github\.com[\S]+/g,
			decoration: (match, view) => {
				const shouldRender = this.shouldRender(view);
				if (!shouldRender) {
					return null;
				}
				return Decoration.replace({ widget: new InlineTagWidget(match[0]) });
			},
		});
		decorations: DecorationSet = Decoration.none;
		constructor(view: EditorView) {
			this.view = view;
			this.plugin = plugin;
			this.component.load();
			this.updateDecorations(view);
		}

		update(update: ViewUpdate): void {
			this.updateDecorations(update.view, update);
		}

		destroy(): void {
			this.component.unload();
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

		shouldRender(view: EditorView) {
			return this.isLivePreview(view.state);
		}
	}

	const InlineViewPluginSpec: PluginSpec<InlineViewPluginValue> = {
		decorations: (plugin) => {
			// Update and return decorations for the CodeMirror view

			return plugin.decorations.update({
				filter: (rangeFrom, rangeTo) =>
					// Check if the range is collapsed (cursor position)
					rangeFrom === rangeTo ||
					// Check if there are no overlapping selection ranges
					!plugin.view.state.selection.ranges.filter((selectionRange) => {
						// Determine the start and end positions of the selection range
						const selectionStart = selectionRange.from;
						const selectionEnd = selectionRange.to;

						// Check if the selection range overlaps with the specified range
						if (selectionStart < rangeFrom) {
							return selectionEnd > rangeFrom; // Overlapping condition
						} else {
							return selectionStart < rangeTo; // Overlapping condition
						}
					}).length,
			});
		},
	};

	return ViewPlugin.fromClass(InlineViewPluginValue, InlineViewPluginSpec);
}
