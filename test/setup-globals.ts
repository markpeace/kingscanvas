import { TransformStream } from "stream/web"
import { TextDecoder, TextEncoder } from "util"

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder
}

if (!globalThis.TextDecoder) {
  // Node's util.TextDecoder type is compatible with the DOM TextDecoder interface
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder
}

if (!globalThis.TransformStream) {
  globalThis.TransformStream = TransformStream as unknown as typeof globalThis.TransformStream
}
