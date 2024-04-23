/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventListenerOrEventListenerObject, EventsMap, QueueEvent, QueueWorker } from "queue";
import type Queue from "queue";
import type { Options } from "queue";

export default class QueueMock implements Queue {
	concurrency: number;
	timeout: number;
	autostart: boolean;
	results: any[] | null;
	length: number = 0;

	constructor(options: Options) {
		this.concurrency = options.concurrency ?? 1;
		this.timeout = options.timeout ?? -1;
		this.autostart = options.autostart ?? false;
		this.results = options.results ?? [];
	}

	push(...workers: QueueWorker[]): number {
		for (const worker of workers) {
			void worker();
		}
		return 0;
	}
	unshift(...workers: QueueWorker[]): number {
		throw new Error("Method not implemented.");
	}
	splice(start: number, deleteCount?: number | undefined): Queue;
	splice(start: number, deleteCount: number, ...workers: QueueWorker[]): Queue;
	splice(start: unknown, deleteCount?: unknown, ...rest: unknown[]): Queue {
		throw new Error("Method not implemented.");
	}
	pop(): QueueWorker | undefined {
		throw new Error("Method not implemented.");
	}
	shift(): QueueWorker | undefined {
		throw new Error("Method not implemented.");
	}
	slice(start?: number | undefined, end?: number | undefined): Queue {
		throw new Error("Method not implemented.");
	}
	reverse(): Queue {
		throw new Error("Method not implemented.");
	}
	indexOf(searchElement: QueueWorker, fromIndex?: number | undefined): number {
		throw new Error("Method not implemented.");
	}
	lastIndexOf(searchElement: QueueWorker, fromIndex?: number | undefined): number {
		throw new Error("Method not implemented.");
	}
	start(callback: (error?: Error | undefined, results?: any[] | null | undefined) => void): void;
	start(): Promise<{ error?: Error | undefined; results?: any[] | null | undefined }>;
	start(): void;
	start(callback?: unknown): void | Promise<{ error?: Error | undefined; results?: any[] | null | undefined }> {
		throw new Error("Method not implemented.");
	}
	stop(): void {
		throw new Error("Method not implemented.");
	}
	end(error?: Error | undefined): void {
		throw new Error("Method not implemented.");
	}
	addEventListener<Event extends keyof EventsMap>(
		name: Event,
		callback: EventListenerOrEventListenerObject<QueueEvent<Event, EventsMap[Event]>>,
		options?: boolean | AddEventListenerOptions | undefined,
	): void {
		throw new Error("Method not implemented.");
	}
	dispatchEvent<Event extends keyof EventsMap>(event: QueueEvent<Event, EventsMap[Event]>): boolean {
		throw new Error("Method not implemented.");
	}
	removeEventListener<Event extends keyof EventsMap>(
		name: Event,
		callback: EventListenerOrEventListenerObject<QueueEvent<Event, EventsMap[Event]>>,
		options?: boolean | EventListenerOptions | undefined,
	): void {
		throw new Error("Method not implemented.");
	}
}
