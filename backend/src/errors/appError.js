class appError extends Error {
  constructor(message, messageCode, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.messageCode = messageCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default appError;
