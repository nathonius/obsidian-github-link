import { editorLivePreviewField } from "obsidian";
import type { DecorationSet, PluginValue, EditorView, ViewUpdate } from "@codemirror/view";
import { Decoration, MatchDecorator, ViewPlugin, WidgetType } from "@codemirror/view";

import type { GithubLinkPlugin } from "../plugin";
import { createTag } from "./inline";

interface DecoSpec {
	widget?: InlineTagWidget;
}

/**
 * CodeMirror widget that replaces the text via Decoration
 * This should be kept as simple as possible; logic on whether
 * or not to render the widget is part of the view plugin
 */
class InlineTagWidget extends WidgetType {
	public readonly href: string;
	constructor(public readonly match: RegExpExecArray) {
		super();
		this.href = match[0];
	}

	eq(other: WidgetType): boolean {
		return other instanceof InlineTagWidget && other.href === this.href;
	}

	toDOM(): HTMLElement {
		const container = createSpan();
		const tag = createTag(this.href);
		container.appendChild(tag);
		return container;
	}
}

export function createInlineViewPlugin(_plugin: GithubLinkPlugin) {
	class InlineViewPluginValue implements PluginValue {
		/**
		 * State for parsing content of a file for code blocks
		 */
		public lastMatchEnd: number = 0;
		public inCodeblock = false;

		public inlineTags: DecorationSet = Decoration.none;

		private readonly matcher = new MatchDecorator({
			regexp: /(?<!\[.*?\]\()https:\/\/github\.com\/[^\s,.)]+/g,
			decorate: (add, from, to, match, _view) => {
				add(
					from,
					to,
					Decoration.replace({
						widget: new InlineTagWidget(match),
					}),
				);
			},
		});

		constructor(private readonly view: EditorView) {
			this.inlineTags = this.matcher.createDeco(view);
		}

		update(update: ViewUpdate): void {
			this.inlineTags = this.matcher.updateDeco(update, this.inlineTags);
		}

		destroy(): void {
			this.inlineTags = Decoration.none;
		}

		isLivePreview(): boolean {
			return this.view.state.field(editorLivePreviewField);
		}

		/**
		 * Check if the decoration at the given position, with the given match, should render
		 */
		shouldRender(decorationFrom: number, decorationTo: number, match: RegExpMatchArray): boolean {
			const view = this.view;

			// Bail if it's not live preview mode
			if (!this.isLivePreview()) {
				return false;
			}

			// Check if we're in a codeblock
			// Note, codeblock check is more expensive than some others,
			// But we do it first to ensure this.inCodeblock remains accurate
			const lastLine = view.state.doc.lineAt(this.lastMatchEnd).number;
			let currentLine = view.state.doc.lineAt(decorationFrom).number;
			while (currentLine >= lastLine) {
				const line = view.state.doc.line(currentLine);
				/**
				 * This is somewhat naive; a four tick codeblock ````
				 * that contains a three tick codeblock ``` will be treated
				 * as ```` open, ``` close, which is not correct, and can
				 * lead to rendering tags where we shouldn't. This could be
				 * fixed with a more complex notion of "inCodeblock", keeping
				 * track of not just the last fence but also the fence content
				 * so we can treat any three tick fences as not changing the
				 * state if they follow a four tick fence, for example.
				 *
				 * However, there may also be a better way to keep track of
				 * open / close fences. See this example, but it didn't work
				 * for me:
				 * https://github.com/OlegWock/obsidian-emera/blob/master/src/processors/block-jsx-processor.ts#L26
				 */
				if (line.text.trim().startsWith("```")) {
					this.inCodeblock = !this.inCodeblock;
				}
				currentLine = line.number - 1;
			}

			if (this.inCodeblock) {
				return false;
			}

			// Ignore matches inside a markdown link
			// TODO: This could probably be a regex.
			const input = match.input ?? "";
			const index = match.index ?? 0;
			const matchValue = match[0];
			if (input[index - 1] === "(" && matchValue.endsWith(")")) {
				return false;
			}

			// Check if this is within an inline code span
			let inInlineCode = false;
			for (let i = 0; i < index; i++) {
				if (input.charAt(i) === "`") {
					inInlineCode = !inInlineCode;
				}
			}
			if (inInlineCode) {
				return false;
			}

			// Check for cursors / selections inside the widget
			const overlap = view.state.selection.ranges.some((r) => {
				if (r.from <= decorationFrom) {
					return r.to >= decorationFrom;
				} else {
					return r.from <= decorationTo;
				}
			});
			if (overlap) {
				return false;
			}

			return true;
		}
	}

	return ViewPlugin.fromClass(InlineViewPluginValue, {
		decorations: (instance) => {
			// Set initial state for code block search
			instance.lastMatchEnd = 0;
			instance.inCodeblock = false;

			// Filter all potential decorations
			return instance.inlineTags.update({
				filter: (from, to, deco) => {
					const spec = deco.spec as DecoSpec;
					const shouldRender = !spec.widget || instance.shouldRender(from, to, spec.widget.match);
					instance.lastMatchEnd = to;
					return shouldRender;
				},
			});
		},
	});
}
