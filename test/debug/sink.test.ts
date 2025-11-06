/**
 * This test assumes the debug sink exposes a subscribe/emit or add/remove listener API.
 * It validates that events pushed into the sink are received by subscribers.
 */
import * as Sink from "@/components/debug/sink"

describe("Debug sink", () => {
  it("delivers events to subscribers", () => {
    const received: any[] = []

    const unsub = Sink.subscribe((evt: any) => {
      received.push(evt)
    })

    const sample = { type: "test", payload: { a: 1 } }
    Sink.emit(sample)

    // allow any microtask queues in sink impl (sync in our case)
    expect(received.length).toBe(1)
    expect(received[0]).toMatchObject(sample)

    // cleanup
    unsub()
  })

  it("unsubscribe stops delivery", () => {
    let count = 0
    const unsub = Sink.subscribe(() => { count += 1 })
    unsub()
    Sink.emit({ type: "another" })
    expect(count).toBe(0)
  })
})
