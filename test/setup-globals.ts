import { ReadableStream, TransformStream } from "stream/web"
import { TextDecoder, TextEncoder } from "util"

if (!process.env.LLM) {
  process.env.LLM = "test-llm"
}

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder
}

if (!globalThis.TextDecoder) {
  // Node's util.TextDecoder type is compatible with the DOM TextDecoder interface
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder
}

if (!globalThis.TransformStream) {
  globalThis.TransformStream = TransformStream as unknown as typeof globalThis.TransformStream
}

if (!globalThis.ReadableStream) {
  globalThis.ReadableStream = ReadableStream as unknown as typeof globalThis.ReadableStream
}
