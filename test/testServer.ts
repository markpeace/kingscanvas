// Lightweight mock server utilities for tests. These stubs provide the same
// surface area that MSW exposes in this project without introducing its ESM
// dependency tree into Jest.

type ListenerOptions = {
  onUnhandledRequest?: "bypass" | ((...args: unknown[]) => void)
}

type Handler = {
  method: string
  path: string
  resolver: (...args: unknown[]) => unknown
}

class MockServer {
  private handlers: Handler[] = []

  listen(_options?: ListenerOptions) {
    // No-op listener for compatibility with MSW's setupServer().
  }

  use(...handlers: Handler[]) {
    this.handlers.push(...handlers)
  }

  resetHandlers() {
    this.handlers = []
  }

  close() {
    this.handlers = []
  }
}

const createHttpMethod = (method: string) =>
  (path: string, resolver: (...args: unknown[]) => unknown): Handler => ({
    method,
    path,
    resolver
  })

export const http = {
  get: createHttpMethod("GET"),
  post: createHttpMethod("POST"),
  put: createHttpMethod("PUT"),
  patch: createHttpMethod("PATCH"),
  delete: createHttpMethod("DELETE")
}

export const HttpResponse = {
  json<T>(data: T, init: { status?: number } = {}) {
    return {
      status: init.status ?? 200,
      body: data
    }
  }
}

export const server = new MockServer()
