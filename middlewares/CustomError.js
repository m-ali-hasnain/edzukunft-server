export default class CustomError extends Error {
  constructor(success, message, status) {
    super(message);
    this.success = success;
    this.message = message;
    this.status = status;
  }
}
