type Subscriber = (items: any[]) => void

class DebugSink {
  private items: any[] = []
  private subs = new Set<Subscriber>()
  private limit = 200

  push(entry: any) {
    this.items = [entry, ...this.items].slice(0, this.limit)
    this.subs.forEach((fn) => fn(this.items))
  }

  subscribe(fn: Subscriber) {
    this.subs.add(fn)
    fn(this.items)
    return () => {
      this.subs.delete(fn)
    }
  }

  clear() {
    this.items = []
    this.subs.forEach((fn) => fn(this.items))
  }
}

export const debugSink = new DebugSink()
