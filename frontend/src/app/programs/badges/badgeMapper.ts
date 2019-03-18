export class BadgeMapper<T> {
  propertyMapping: any;
  target: any;
  constructor(type: { new (): T }) {
    this.target = new type();
    this.propertyMapping = this.target.constructor._propertyMap;
  }

  map(source) {
    Object.keys(this.target).forEach(key => {
      const mappedKey = this.propertyMapping[key];
      if (mappedKey) {
        this.target[key] = source[mappedKey];
      } else {
        this.target[key] = source[key];
      }
    });
    Object.keys(source).forEach(key => {
      const targetKeys = Object.keys(this.target);
      if (targetKeys.indexOf(key) === -1) {
        this.target[key] = source[key];
      }
    });
    return this.target;
  }
}

export function propertyMap(sourceProperty: string) {
  return function(target: any, propertyKey: string) {
    if (!target.constructor._propertyMap) {
      target.constructor.propertyMap = {};
    }
    target.constructor.propertyMap[propertyKey] = sourceProperty;
  };
}

// return this.http.get<T>(url).pipe(
//   map(data =>
//     data.map((item: any) => {
//       return new ModelMapper(itemType).map(item);
//     })
//   )
// );
