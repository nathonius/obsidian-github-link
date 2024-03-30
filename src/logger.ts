export enum LogLevel {
	Error = 0,
	Warn = 1,
	Info = 2,
	Debug = 3,
}

export class Logger {
	public logLevel: LogLevel = LogLevel.Error;
	public log(message: unknown, level: LogLevel) {
		let _message;
		if (typeof message === "string") {
			_message = `GitHub Link: ${message}`;
		} else {
			_message = message;
		}
		if (level <= this.logLevel) {
			switch (level) {
				case LogLevel.Error:
					console.error(_message);
					break;
				case LogLevel.Warn:
					console.warn(_message);
					break;
				case LogLevel.Info:
					console.info(_message);
					break;
				case LogLevel.Debug:
					console.debug(_message);
					break;
			}
		}
	}

	public error(message: unknown) {
		this.log(message, LogLevel.Error);
	}

	public warn(message: unknown) {
		this.log(message, LogLevel.Warn);
	}

	public info(message: unknown) {
		this.log(message, LogLevel.Info);
	}

	public debug(message: unknown) {
		this.log(message, LogLevel.Debug);
	}
}
