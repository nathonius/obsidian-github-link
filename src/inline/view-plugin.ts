import { Component, editorLivePreviewField } from "obsidian";
import { Decoration, MatchDecorator, ViewPlugin, WidgetType } from "@codemirror/view";
import type { DecorationSet, EditorView, PluginSpec, PluginValue, ViewUpdate } from "@codemirror/view";

import type { GithubLinkPlugin } from "../plugin";
import { createTag } from "./inline";
import { valueWithin } from "src/util";

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
		private readonly component = new Component();
		private readonly plugin: GithubLinkPlugin;
		private readonly match = new MatchDecorator({
			regexp: /(https:\/\/)?github\.com[\S]+/g,
			decoration: (match, view, pos) => {
				const shouldRender = this.shouldRender(view, pos);
				if (!shouldRender) {
					return null;
				}
				return Decoration.replace({ widget: new InlineTagWidget(match[0]) });
			},
		});
		decorations: DecorationSet = Decoration.none;
		constructor(view: EditorView) {
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
				this.match.updateDeco(update, this.decorations);
			}
		}

		isLivePreview(state: EditorView["state"]): boolean {
			return state.field(editorLivePreviewField);
		}

		shouldRender(view: EditorView, pos: number) {
			const selection = view.state.selection;
			const isLivePreview = this.isLivePreview(view.state);
			const cursorOverlap = selection.ranges.some((range) => valueWithin(pos, range.from - 1, range.to + 1));
			return isLivePreview && !cursorOverlap;
		}
	}

	const InlineViewPluginSpec: PluginSpec<InlineViewPluginValue> = {
		decorations: (plugin) => plugin.decorations,
	};

	return ViewPlugin.fromClass(InlineViewPluginValue, InlineViewPluginSpec);
}
