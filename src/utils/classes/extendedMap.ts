export default class ExtendedMap<K extends Object, V> {
  private readonly map = new Map<string, V>();

  constructor(private defaultValueFunction: (key: K) => V) {}

  get(key: K): V {
    if (!this.map.has(key.toString())) {
      this.map.set(key.toString(), this.defaultValueFunction(key));
    }
    return this.map.get(key.toString())!;
  }

  has(key: K): boolean {
    return this.map.has(key.toString());
  }

  set(key: K, value: V): this {
    this.map.set(key.toString(), value);
    return this;
  }

  clear(): void {
    this.map.clear();
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }
}
