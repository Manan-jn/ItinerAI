import inspect

class AppException(Exception):
    def __init__(self, message: str, status_code: int = 500, detail: str = None):
        frame = inspect.stack()[1]
        self.function = frame.function 
        self.message = message
        self.status_code = status_code
        self.detail = detail if detail else f"[{self.function}] {self.message}"
        super().__init__(self.detail)